from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta


class Activity(models.Model):
    user = models.ForeignKey(User, related_name='activities')
    name = models.CharField(max_length=255, default='')

    def total(self):
        return sum((p.end - p.start for p in self.periods.all() if p.valid()), timedelta(0))

    def running(self):
        try:
            return not self.periods.latest('start').valid()
        except Period.DoesNotExist:
            return False

    def __str__(self):
        return self.name


class Period(models.Model):
    activity = models.ForeignKey(Activity, related_name='periods')
    start = models.DateTimeField('start time', default=timezone.now)
    end = models.DateTimeField('end time', null=True, blank=True)

    def valid(self):
        '''Return if the period is valid'''
        return self.end is not None

    def __str__(self):
        return '[{} - {}]'.format(self.start, self.end)


