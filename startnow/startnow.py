import logging
import json
import datetime
''' Local Modules '''
from url_processor import UrlProcessor
from request_processor import RequestProcessor
from path_processor import PathProcessor

logger = logging.getLogger(__name__)

logging.basicConfig(level=logging.DEBUG)


class Scheduler:

    def __init__(self, orig_lat, orig_lng, dest_lat, dest_lng, local_time):
        self.orig_lat   = orig_lat
        self.orig_lng   = orig_lng
        self.dest_lat   = dest_lat
        self.dest_lng   = dest_lng
        self.local_time = local_time

    def validate_data(self):
        if (self.orig_lat and self.orig_lng and self.dest_lat and self.dest_lng):
            return true
        else:
            return false

    def get_schedule(self):
        if not self.validate_data:
            return
        url_proc = UrlProcessor(self.orig_lat, self.orig_lng, self.dest_lat, self.dest_lng, self.local_time)
        '''Algorithmn to update count and range'''
        url_list = url_proc.create_url(24, 24)
        logger.info("Processing URL List {}".format(url_list))
        if len(url_list) > 0:
            request_processor = RequestProcessor(url_list)
            resp = request_processor.process_requests(url_list)
            path_proc = PathProcessor(resp)
            min, max, curr = path_proc.getDetails()
            try:
                resp.append(('min_duration', min))
                resp.append(('max_duration', max))
                resp.append(('cur_duration', curr))
            except Exception as e:
                print e
            for ts_epoch, duration in resp:
                logger.info("{} {}".format(ts_epoch, duration))
        return resp


