from django.conf.urls import include, url
from django.contrib import admin
from .views import index, UserViewSet, ActivityViewSet, PeriodViewSet
from rest_framework import routers
from . import views

router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'activities', ActivityViewSet)
router.register(r'periods', PeriodViewSet)
#router.register(r'users2', views.UserList)

urlpatterns = [
    url(r'^$', index, name='index'),
    url(r'^api/', include(router.urls)),
]
