import logging 
#import ssl
import simplejson
import urllib2
import datetime
#from multiprocessing.dummy import Pool as ThreadPool
#from request import async
import urlparse
from deploy import DEPLOY_STATUS
from google.appengine.api import urlfetch
import grequests

logging.basicConfig()

logger = logging.getLogger(__name__)

class RequestProcessor:
    def __init__(self, url_list):
        self.url_list = url_list
        self.duration_list = []
        self.result = []

    def process_atomic_request(self, (atime, url)):
        #context = ssl._create_unverified_context()
        #response = simplejson.load(urllib2.urlopen(url, context=context))
        response = simplejson.load(urllib2.urlopen(url))
        status = response['status']
        if status == "OK":
            logger.info("Response Successfull")
            row = response['rows']
            for row_elem in row:
                elems = row_elem['elements']
                for e in elems:
                    duration = e['duration_in_traffic']['text']
        return (utime, duration)

    #def process_async_requests(self, url_list):
    #    pool = ThreadPool(len(url_list))
    #    result = pool.map(self.process_atomic_request, url_list)
    #    pool.close()
    #    pool.join()
    #    return result

    #def process_async_response(self, response):
    #    print response

    def parse_url_time(self, url):
        query_string_dict = urlparse.parse_qs(url)
        atime = query_string_dict['departure_time'][0]
        utime =  datetime.datetime.fromtimestamp(float(atime)).strftime('%Y-%m-%d %H:%M:%S')
        return utime

    def parse_rs(self, url, response):
        status = response['status']
        if status == "OK":
            logger.info("Response Successfull")
            row = response['rows']
            for row_elem in row:
                elems = row_elem['elements']
                for e in elems:
                    duration = e['duration_in_traffic']['text']
        logger.info("Duration deduced {}".format(duration))
        return duration

    def parse_reponses(self, responses):
        result = []
        for response in responses:
            utime = self.parse_url_time(response.url)
            rs = simplejson.loads(response.content)
            duration = self.parse_rs(response.url, rs)
            result.append((utime, duration))
        return result

    def process_async_requests(self, url_list):
        async_list = []
        print url_list
        async_requests = [grequests.get(url) for time,url in url_list]
        rs = grequests.map(async_requests)
        result = self.parse_reponses(rs)
        return result

    def url_fetch_handle_responses(self, rpc):
        url = rpc.request.url()
        utime = self.parse_url_time(url)
        response = rpc.get_result()
        json_dict = simplejson.loads(response.content)
        duration = self.parse_rs(url, json_dict)
        self.result.append((utime, duration))

    def create_callback(self, rpc):
        return lambda: self.url_fetch_handle_responses(rpc)

    def process_google_requests(self, url_list):
        self.result = []
        rpcs = []
        for time,url in url_list:
            rpc = urlfetch.create_rpc()
            rpc.callback = self.create_callback(rpc)
            urlfetch.make_fetch_call(rpc, url)
            rpcs.append(rpc)
        for rpc in rpcs:
            rpc.wait()
        logger.info("Result in list {}".format(self.result))
        return self.result

    def parse_param_value(self, text):
        param,value=text.split("=", 1)
        print param,value
        return(param,value)

    def process_requests(self, url_list):
        try:
            if DEPLOY_STATUS == 1:
                return (self.process_google_requests(url_list))
            else:
                return (self.process_async_requests(url_list))
        except Exception as e:
            logger.error("Unable to open deploy.text file {}".format(e))
