from rest_framework import serializers
from .models import User, Activity, Period

class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('url', 'username', 'email')
        extra_kwargs = {
            'url': {'view_name': 'timeperiod:user-detail'},
        }

class ActivitySerializer(serializers.HyperlinkedModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())

    class Meta:
        model = Activity
        fields = ('url', 'user', 'name', 'total', 'running')
        extra_kwargs = {
            'url': {'view_name': 'timeperiod:activity-detail'},
            'user': {'view_name': 'timeperiod:user-detail'},
        }


class PeriodSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Period
        fields = ('url', 'activity', 'start', 'end', 'valid')
        extra_kwargs = {
            'url': {'view_name': 'timeperiod:period-detail'},
            'activity': {'view_name': 'timeperiod:activity-detail'},
        }
