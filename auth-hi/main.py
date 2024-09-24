import os
import http.server
import socketserver
import requests
import secrets

index_html = '<a href="https://github.com/login/oauth/authorize?client_id=Iv23lifkFb0BVBeDCugm">Login with GitHub</a>'
client_id = 'Iv23lifkFb0BVBeDCugm'
client_sec = os.environ['CLIENT_SEC']

PORT = int(os.environ['PORT'])
Handler = http.server.SimpleHTTPRequestHandler

known_users = {}

def code2tok(code):
    json_header = {"Accept": "application/json"}
    body =  "client_id=" + client_id + "&"\
         +  "client_secret=" + client_sec + "&"\
         +  "code=" + code
    response = requests.post("https://github.com/login/oauth/access_token",
        headers=json_header, data=body)
    print(response.json())
    return(response.json()['access_token'])

def tok2user(tok):
    header = {
        "Accept": "application/vnd.github+json",
        "Authorization": ("Bearer " + tok),
        "X-GitHub-Api-Version": "2022-11-28"
    }
    response = requests.get("https://api.github.com/user", headers=header)
    return(response.json()['login'])

def add_user(login, cookie):
    known_users[cookie] = login

class myHandler(http.server.BaseHTTPRequestHandler):
    print("known_users", known_users)
    def do_GET(self):
        req_cookies = http.cookies.SimpleCookie(self.headers.get('Cookie'))
        if ('logincookie') in req_cookies:
            self.send_response(200, 'OK')
            self.send_header('Content-type', 'html')
            self.end_headers()
            user = known_users[req_cookies['logincookie'].value]
            self.wfile.write(bytes("Hi " + user, 'UTF-8'))            
        elif (self.path.startswith("/callingback?code=")):
            code = self.path[18:]
            login = tok2user(code2tok(code))
            cookie = secrets.token_urlsafe(16)
            add_user(login, cookie)
            mycookies = http.cookies.SimpleCookie()
            mycookies['logincookie'] = cookie
            self.send_response(200, 'OK')
            self.send_header('Content-type', 'html')
            for morsel in mycookies.values():
                self.send_header("Set-Cookie", morsel.OutputString())
            self.end_headers()
            self.wfile.write(bytes("Welcome " + login, 'UTF-8'))            
        else:
            self.send_response(200, 'OK')
            self.send_header('Content-type', 'html')
            self.end_headers()
            self.wfile.write(bytes(index_html, 'UTF-8'))

with socketserver.TCPServer(('', PORT), myHandler) as ser:
    ser.serve_forever()