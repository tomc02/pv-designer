from django.db import models
from django.contrib.auth.models import User

# Create your models here.
# Createre Post model
class Post(models.Model):
    title = models.CharField(max_length=200)
    body = models.TextField()
    date = models.DateTimeField()
    def __str__(self):
        return self.title
