from rest_framework import serializers
from .models import User, Activity, Period

class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('url', 'username', 'email', 'activities')
        extra_kwargs = {
        'url': {'view_name': 'timeperiod:user-detail'},
        'activities': {'view_name': 'timeperiod:activity-detail'},
        }

class ActivitySerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Activity
        fields = ('url', 'user', 'name', 'periods')
        extra_kwargs = {
        'url': {'view_name': 'timeperiod:activity-detail'},
        'user': {'view_name': 'timeperiod:user-detail'},
        'periods': {'view_name': 'timeperiod:period-detail'},
        }

class PeriodSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Period
        fields = ('url', 'activity', 'start', 'end', 'valid')
        extra_kwargs = {
        'url': {'view_name': 'timeperiod:period-detail'},
        'activity': {'view_name': 'timeperiod:activity-detail'}
        }
