from django.db import models
from django.contrib.auth.models import User


class Activity(models.Model):
    user = models.ForeignKey(User, related_name='activities')
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class Period(models.Model):
    activity = models.ForeignKey(Activity, related_name='periods')
    start = models.DateTimeField('start time')
    end = models.DateTimeField('end time')

    def valid(self):
        '''Return if the period is valid'''
        return self.end > self.start

    def __str__(self):
        return '[{} - {}]'.format(self.start, self.end)


