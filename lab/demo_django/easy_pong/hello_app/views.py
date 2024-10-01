from django.shortcuts import render
from django.http import HttpResponse
from django.views.generic import TemplateView


# Create your views here.
# Existing view for the hello page without a template


def hello_page(request):
    return HttpResponse(
        """
        Hello, welcome to the Hello App!<br>
        <a href='/helloapp/htmlcss/'>Go to HTML & CSS Page</a><br>
        <a href='/helloapp/page_with_css/'>Go to Page with CSS</a><br>
        <a href='/helloapp/page_with_css_and_js/'>Go to Page with CSS and JS</a><br>
        <a href='/helloapp/cbv-example/'>Go to Class-Based View Page</a>

        """
    )


# New view for the HTML & CSS page
def html_css_page(request):
    return render(request, "hello_app/htmlcss.html")


# def html_css_page(request):
#     return render(request, "hello_app/test.html")


def page_with_css(request):
    return render(request, "hello_app/page_with_css.html")


def page_with_css_and_js(request):
    return render(request, "hello_app/page_with_css_and_js.html")


class CBVExamplePage(TemplateView):
    template_name = "hello_app/cbv_example.html"
