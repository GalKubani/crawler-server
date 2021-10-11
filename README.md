This is the crawler server, will get the request from the client and process it, taking the page title, and internal links.
it will send the links to an sqs queue in order to be saved for processing later on by the worker
will have a seperate route for the worker responses, so the server just launchs the workers according to the number of links in the queue.
when the workers finish they send a new request to the server, updated it which links were scraped, which were invalid, and which were scraped in the past.
