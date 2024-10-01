from django.urls import path
from . import views

urlpatterns = [
    path(
        "", views.hello_page, name="hello_page"
    ),  # This maps the root of /helloapp/ to hello_page view
    # New path for the HTML & CSS page
    path("htmlcss/", views.html_css_page, name="html_css_page"),
    path("page_with_css/", views.page_with_css, name="page_with_css"),
    path(
        "page_with_css_and_js/", views.page_with_css_and_js, name="page_with_css_and_js"
    ),
    path(
        "cbv-example/", views.CBVExamplePage.as_view(), name="cbv_example"
    ),  # Class-based view
]
