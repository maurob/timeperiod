from django.shortcuts import render
from rest_framework import viewsets, generics
from rest_framework.decorators import detail_route, list_route
from rest_framework.response import Response
from .serializers import UserSerializer, ActivitySerializer, PeriodSerializer
from .models import User, Activity, Period
from datetime import timedelta

from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework import exceptions
from .permissions import UserIsOwnerOrAdmin

def index(request):
    return render(request, 'timeperiod/index.html')

class UserList(generics.ListAPIView):
    model = User
    serializer_class = UserSerializer
    permission_classes = [
        UserIsOwnerOrAdmin,
    ]    


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    #permission_classes = [UserIsOwnerOrAdmin]

    def dispatch(self, request, *args, **kwargs):
        if kwargs.get('pk') == 'current' and request.user:
            kwargs['pk'] = request.user.pk

        return super(UserViewSet, self).dispatch(request, *args, **kwargs)

    def list(self, request):
        if request.user and request.user.is_staff:
            return super(UserViewSet, self).list(request)
        else:
            raise exceptions.PermissionDenied

    @detail_route(methods=['get'])
    def activities(self, request, pk=None):
        user = self.get_object()
        return Response(ActivitySerializer(user.activities, many=True, context={'request': request}).data)


class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer

    def list(self, request):
        if request.user and request.user.is_staff:
            return super(ActivityViewSet, self).list(request)
        else:
            queryset = self.queryset.filter(user=request.user)
            serializer = self.serializer_class(queryset, many=True, context={'request': request})
            return Response(serializer.data)

    @detail_route(methods=['get'])
    def total(self, request, pk=None):
        activity = self.get_object()
        total = sum((p.end - p.start for p in activity.periods.all() if p.valid()), timedelta(0))
        return Response(total)

    @detail_route(methods=['get'])
    def periods(self, request, pk=None):
        activity = self.get_object()
        return Response(PeriodSerializer(activity.periods, many=True, context={'request': request}).data)


class PeriodViewSet(viewsets.ModelViewSet):
    queryset = Period.objects.all()
    serializer_class = PeriodSerializer

    def list(self, request):
        if request.user and request.user.is_staff:
            return super(PeriodViewSet, self).list(request)
        else:
            queryset = self.queryset.filter(activity__user=request.user)
            serializer = self.serializer_class(queryset, many=True, context={'request': request})
            return Response(serializer.data)
  
