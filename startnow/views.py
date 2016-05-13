from django.shortcuts import render
from django.template import RequestContext, loader
from django.http import HttpResponse
from django.http import JsonResponse
from startnow import  Scheduler
import json
from django.views.decorators.csrf import ensure_csrf_cookie

def handlePostMethod(request):
    print "Inside post method"
    print request.body
    orig_lat = request.POST.get("orig_lat")
    orig_lng = request.POST.get("orig_lng")
    dest_lat = request.POST.get("dest_lat")
    dest_lng = request.POST.get("dest_lng")
    local_time = request.POST.get("localtime")
    sched = Scheduler(orig_lat, orig_lng, dest_lat, dest_lng, local_time)
    return (sched.get_schedule())


def json_schedule_list(list):
    json_list = []
    for date, duration in list:
        d = {}
        if 'duration' in date:
            d[date] = duration
        else:
            d['date']=date
            d['duration']=duration
        json_list.append(d)
    return json_list

@ensure_csrf_cookie
def index(request):
    if request.method == 'POST':
        list = handlePostMethod(request)
        json_list = json_schedule_list(list)
        print json_list
        return JsonResponse({'sched_list':json_list})
    else:
        template = loader.get_template('startnow/index.html')
        context = RequestContext(request)
        return HttpResponse(template.render(context))

def empty(request):
    return HttpResponse('')


# Create your views here.
