/*global angular, console, d3, Utils*/
/*jslint nomen: true*/
var ES = angular.module('ES', ['elasticsearch']);
ES.factory('es', function (esFactory) {
    'use strict';
    var self = {}, size = 100,
        myStop = ["i", "my", "dr", "me", "you", "so", "all", "he", "she", "it", "they", "we", "our"];
    
    self.params = function (params) {
        Object.keys(params).forEach(function (p) {
            self[p] = params[p];
        });
    };
    
    self.client = function () {
        if (self._client) {
            return self._client;
        }
        
        var host = "";
        if (self.user && self.user.length > 0) {
            host = "http://" + self.user + ":" + self.password + "@" + self.host;
        } else {
            host = "http://" + self.host;
        }
        
        
        self._client = esFactory({
            host: host,
            apiVersion: '1.4',
            requestTimeout : 600000
        });
        return self._client;
    };
    
    self.stats = {};
    
    self.login = function (security) {
        self.user = security.user;
        self.password = security.password;
        self._client = undefined;
        
        var query = {
            "aggs": {
                "dateMax": {
                    "max": {
                        "field": "review.created"
                    }
                },
                "dateMin": {
                    "min": {
                        "field": "review.created"
                    }
                },
                "histogram" : {
                    "date_histogram" : {
                        "field" : "review.created",
                        "interval" : "month",
                        "format" : "MMM yyyy",
                        "min_doc_count" : 0
                    }
                }
            }
        };
        
        return self.client().search({
            index: self.index,
            type: "reviews",
            size: 0,
            body: query
        }).then(function (result) {
            self.stats = result.aggregations;
            if (result.status === 401) {
                return false;
            } else {
                return true;
            }
        });
    };
    
    /*Filter properties ----------------------*/
    self.hasFacets = function (filters) { return filters.filters && filters.filters.length > 0 ? true : false; };
    self.hasSearch =  function (filters) { return filters.search && filters.search.length > 0 ? true : false; };
    self.hasDate =  function (filters) { return filters.date ? true : false; };
    self.filterDate =  function (filters) {
        return self.hasDate(filters) &&
            (filters.date.from.stamp > self.stats.dateMin.value ||
            filters.date.to.stamp < self.stats.dateMax.value) ? true : false;
    };
    self.onlyDate = function (filters) { return !self.hasFacets(filters) && !self.hasSearch(filters) && self.filterDate(filters); };
    self.hasId =  function (filters) { return filters.id && filters.id.length > 0 ? true : false; };
    self.hasFilter =  function (filters) { return self.hasFacets(filters) || self.filterDate(filters) || self.hasSearch(filters); };
    
    /*Queries Parts -------------------------*/
    self.query = function (filters) {
        var q = [], facets;
        if (self.hasSearch(filters)) {
            filters.search = filters.search
                .toLowerCase()
                .replace(" and ", " AND ")
                .replace(" or ", " OR ");
            
            q.push("review.text:(" + filters.search + ")");
        }

        if (self.hasFacets(filters)) {
            facets = filters.filters.map(function (f) {
                return "(" + f.value.map(function (v) {
                    if(v[0] === ">" || v[0] === "<") {
                        return f.det.field + ":(" + v + ")";
                    }
                    return f.det.field + ":\"" + v + "\"";
                }).join(" OR ") + ")";
            }).join(" AND ");
            q.push(facets);
        }
        
        if (self.hasId(filters)) {
            q.push("_id:" + filters.id);
        }
        
        if (self.filterDate(filters)) {
            q.push("review.created:[" + filters.date.from.stamp + " TO " + filters.date.to.stamp + "]");
        }
        
        if (q.length === 0) {
            return {"match_all": {}};
        }
        
        return {
            "query_string": {
                "query": q.join(" AND ")
            }
        };
    };
    
    self.highlight = function () {
        return {
            "fields": {
                "review.text": {
                    "fragment_size" : 300,
                    "number_of_fragments" : 3,
                    "no_match_size": 300
                }
            }
        };
    };
    
    self.agg = function (field, significant, minCount, script) {
        minCount = minCount || 1;
        if (significant) {
            if(script) {
                return {
                    "terms": {
                        "script": script,
                        "size": 500,
                    }
                };
            }
            return {
                "significant_terms": {
                    "field": field,
                    "size": 500,
                    "min_doc_count": minCount,
                    "script_heuristic": {
                        "script": "_subset_freq"
                    }
                }
            };
        } else {
            if(script) {
                return {
                    "terms": {
                        "script": script,
                        "size": 500,
                    }
                };
            }
            return {
                "terms": {
                    "field": field,
                    "size": 500,
                    "min_doc_count": minCount
                }
            };
        }
        
    };
   
    self.sort = function (filter) {
        var field, mode, r = {};
        switch (filter.sortDocuments) {
        case "relevance":
            return undefined;
        case "date":
            field = "review.created";
            mode = "asc";
            break;
        case "date-desc":
            field = "review.created";
            mode = "desc";
            break;
        case "stars":
            field = "review.rating";
            mode = "asc";
            break;
        case "stars-desc":
            field = "review.rating";
            mode = "desc";
            break;
        }
        r[field] = {"order" : mode};
        return [r];
    };
    
    self.suggest = function (filter) {
        if (!self.hasSearch(filter)) {
            return undefined;
        }
        return {
            "suggestions" : {
                "text" : filter.search,
                "term" : {
                    "field" : "review.text",
                    "suggest_mode": "popular"
                }
                
            }
        };
    };
    /*Requests ---------------------*/
    self.getDocuments = function (filters, from) {
        var query = {
            query: self.query(filters),
            sort: self.sort(filters),
            highlight: self.highlight(),
            suggest: self.suggest(filters)
        };
        
        return self.client().search({
            index: self.index,
            type: "reviews",
            size: size,
            from: from,
            body: query
        }).then(function (result) {
            var suggestions = [],
                docs = result.hits.hits,
                total = result.hits.total;
            docs = docs.map(function (d) {
                var newD = d._source;
                if (!d.highlight) {
                    newD.text = newD.review.text;
                } else {
                    newD.text = d.highlight["review.text"][0];
                }
                newD.t1 = newD.text[newD.text.length - 1];
                newD.t2 = newD.review.text[newD.review.text.length - 1];
                newD.id = d._id;
                if (newD.text[newD.text.length - 1] !== newD.review.text[newD.review.text.length - 1]) {
                    newD.text = newD.text + "...";
                }
                
                return newD;
            });
            
            if (result.suggest) {
                suggestions = result.suggest.suggestions.map(function (s) {
                    s.options = s.options.filter(function (o) { return o.freq > 10; });
                    return s;
                }).filter(function (s) {return s.options.length > 0; });
            }
            console.log(result);
            return {docs: docs, total: total, suggestions: suggestions};
        });
    };
    
    self.getDocument = function (filters, fragSize) {
        var numFrags = fragSize ? 3 : 0,
            noMatch = fragSize ? 50 : 1000000,
            
            query = {
                query: self.query(filters),
                highlight: {
                    "fields": {
                        "review.text": {
                            "fragment_size" : fragSize,
                            "number_of_fragments" : numFrags,
                            "no_match_size": noMatch
                        }
                    }
                }
            };
        return self.client().search({
            index: self.index,
            type: "reviews",
            size: size,
            body: query
        }).then(function (result) {
            var docs = result.hits.hits;
            docs = docs.map(function (d) {
                var newD = d._source;
                newD.text = d.highlight["review.text"][0];
                newD.high = d.highlight["review.text"];
                newD.t1 = newD.text[newD.text.length - 1];
                newD.t2 = newD.review.text[newD.review.text.length - 1];
                newD.id = d._id;
                if (newD.text[newD.text.length - 1] !== newD.review.text[newD.review.text.length - 1]) {
                    newD.text = newD.text + "...";
                }
                
                return newD;
            });
            return docs[0];
        });
    };
    
    self.getHistogram = function (filters) {
        filters.date = false;
        var query = {
            query: self.query(filters),
            aggs: {
                "histogram" : {
                    "date_histogram" : {
                        "field" : "review.created",
                        "interval" : "month",
                        "format" : "MMM yyyy",
                        "min_doc_count" : 0,
                        "extended_bounds": {
                            "min": self.stats.dateMin.value,
                            "max": self.stats.dateMax.value
                        }
                    }
                }
            }
        };
        
        return self.client().search({
            index: self.index,
            type: "reviews",
            size: 0,
            body: query
        }).then(function (result) {
            result.aggregations.histogram.buckets.forEach(function (d) {
                if (!self.hasFilter(filters)) {
                    d.isGlobal = true;
                } else {
                    d.globalValue = self.stats.histogram.buckets.find(function (g) { return g.key === d.key; }).doc_count;
                    d.percent = d.doc_count / d.globalValue;
                }
            });
            return result.aggregations.histogram.buckets;
        });
        
    };
    
    self.getFacets = function (filters, facets, config) {
        var query = {
                query: self.query(filters),
                aggs: {}
            },
            significant = false;
        
        if (self.hasFilter(filters)) {
            significant = true;
        }
        facets.forEach(function (f) {
            query.aggs[f.title] = self.agg(f.field, significant, config.minCount, f.script);
        });
        
        return self.client().search({
            index: self.index,
            type: "reviews",
            size: 0,
            body: query
        }).then(function (result) {
            var facs = [], chartField = 'doc_count';
            
            Object.keys(result.aggregations).forEach(function (k) {
                var max = d3.max(result.aggregations[k].buckets, function (b) {
                        return b[chartField];
                    }),
                    maxPercent = d3.max(result.aggregations[k].buckets, function (b) {
                        b.percent = b.doc_count / b.bg_count;
                        return b.percent;
                    }),
                    parent = facets.filter(function (f) {return f.title === k; })[0],
                    directive = parent.directive,
                    title = parent.title,
                    order = parent.order;
                
                if (k === "Rating") {
                    result.aggregations[k].buckets.sort(Utils.fieldSort("key"));
                }
                if (k === "NumReviews") {
                    result.aggregations[k].buckets.sort(function(a, b) { 
                        var keya = parseInt(a.key.replace(">", "").replace("=", ""));
                        var keyb = parseInt(b.key.replace(">", "").replace("=", ""));
                        
                        if(a.key[0] === ">" && b.key[0] !== ">") {
                            return 1;
                        }
                        if(a.key[0] !== ">" && b.key[0] === ">") {
                            return -1;
                        }
                        
                        return keya - keyb;
                    });
                }
                facs.push({facet: k, data: result.aggregations[k].buckets, others: result.aggregations[k].sum_other_doc_count, max: max, maxPercent: maxPercent, order: order, title: title, directive: directive});
            });
            return facs;
        });
    };
    
    self.getTerms = function (filters, type) {
        var size = 50, field = "review.text",
            re = /(\w+)/g,
            exclude = self.hasSearch(filters) ? myStop.concat(filters.search.match(re)) : myStop,
            query = {
                query: self.query(filters),
                aggs: {}
            };
            
        exclude.join("|");
            
        if (type === 'bigrams') {
            size = 20;
            field = 'review.text.bigrams';
            //exclude = myStop.map(function (w) { return w + " .*|.* " + w; }).join("|") + "|.* _|_ .*";
            exclude = "|.* _|_ .*";
            
        }
        
        if (self.hasFilter(filters)) {
            query.aggs =  {
                "Terms": {
                    "significant_terms": {
                        "field": field,
                        "size": size,
                        "exclude": exclude
                    }
                }
            };
        } else {
            query.aggs =  {
                "Terms": {
                    "terms": {
                        "field": field,
                        "size": size,
                        "exclude": exclude
                    }
                }
            };
        }

        return self.client().search({
            index: self.index,
            type: "reviews",
            size: 0,
            body: query
        }).then(function (result) {
            return { max: d3.max(result.aggregations.Terms.buckets, function (d) {return d.doc_count; }), data: result.aggregations.Terms.buckets};
        });
    };
    
    
    
    return self;
});

























