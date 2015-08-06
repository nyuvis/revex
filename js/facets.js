/*global Tex, d3, console, Utils, topojson*/

var percentColor = function (value) {
        'use strict';
        if (value < 0.001) { return "hsl(200, 20%, 80%)"; }
        if (value < 0.01) { return "hsl(200, 40%, 70%)"; }
        if (value < 0.1) { return "hsl(200, 60%, 60%)"; }
        if (value < 0.5) { return "hsl(200, 80%, 50%)"; }
        return "hsl(200, 100%, 40%)";
    },
    countColor = function (value) {
        'use strict';
        if (value < 5) { return "hsl(200, 20%, 80%)"; }
        if (value < 50) { return "hsl(200, 40%, 70%)"; }
        if (value < 500) { return "hsl(200, 60%, 60%)"; }
        if (value < 5000) { return "hsl(200, 80%, 50%)";  }
        return "hsl(200, 100%, 40%)";
    };

var facets = {
    rating: function (facet, data) {
        'use strict';
        var title, table, avg, tdsCount, tdsPercent,
            barWidth = 75,
            countScale = d3.scale.linear().range([0, barWidth]).domain([0, data.max]),
            percentScale = d3.scale.linear().range([0, barWidth]).domain([0, data.maxPercent]);
        
        
        function buildTable() {
            table = facet.board.append("table");
            var footer, header = table.append("tr"),
                lines = table.selectAll(".line").data(data.data)
                .enter()
                .append("tr")
                .attr("class", "line")
                .on("click", function (d) {
                    facet.onSelect(d, data);
                });
            header.append("th").text("");
            
            
            
            
            lines.append("td")
                .attr("class", "label")
                .text(function (d) {return d.key + (d.key === 1 ? " star" : " stars"); });
            
            if (data.maxPercent) {
                header.append("th").text("Proportion");
                tdsPercent = lines.append("td")
                    .attr("class", "bar");

                tdsPercent.append("div")
                        .attr("class", "barBase")
                    .on("mouseover", function (d) {
                        facet.showToolTip('<label>Count: </label><span>' + d.doc_count + "</span></br>");
                    })
                    .on("mouseout", function (d) {
                        facet.hideToolTip();
                    });


                tdsPercent.append("div")
                    .attr("class", "barValue")
                    .on("mouseover", function (d) {
                        facet.showToolTip('<label>Percent: </label><span>' + (d.percent * 100).toFixed(2) + "%" + "</span></br>");
                    })
                    .on("mouseout", function (d) {
                        facet.hideToolTip();
                    })
                    .style({
                        width: function (d) {return percentScale(d.percent) + 'px'; },
                        "background-color": function (d) { return facet.colors.percentDis(d.percent); }
                    });
            }
            header.append("th").text("Count");
            tdsCount = lines.append("td")
                .attr("class", "bar");
            
            tdsCount.append("div")
                    .attr("class", "barBase")
                .on("mouseover", function (d) {
                    facet.showToolTip('<label>Count: </label><span>' + d.doc_count + "</span></br>");
                })
                .on("mouseout", function (d) {
                    facet.hideToolTip();
                });
            
            tdsCount.append("div")
                .attr("class", "barValue")
                .on("mouseover", function (d) {
                    facet.showToolTip('<label>Count: </label><span>' + d.doc_count + "</span></br>");
                })
                .on("mouseout", function (d) {
                    facet.hideToolTip();
                })
                .style({
                    width: function (d) {return countScale(d.doc_count) + 'px'; },
                    "background-color": function (d) { return facet.colors.countDis(d.doc_count); }
                });
            
            lines.append("td")
                .attr("class", "value")
                .text(function (d) {return " " + d.doc_count; });
            header.append("th").text("");
            footer = table.append("tr").attr("class", "footer");
            footer.append("td").text("");
            if (data.maxPercent) {
                footer.append("td").attr("class", "maxValue").text((data.maxPercent * 100).toFixed(3) + '%');
            }
            footer.append("td").attr("class", "maxValue").text(data.max);
            footer.append("td").text("");
        }
        
        facet.build = function () {
            var sum = 0, weightedSum = 0;
            data.data.forEach(function (d) {
                sum += d.doc_count;
                weightedSum += d.doc_count * d.key;
            });
            avg = weightedSum / sum;
            facet.title.append("span").text(" (Avg: " + avg.toFixed(1) + ")");
            buildTable();
        };
        
        
    },
    numReviews: function (facet, data) {
        'use strict';
        var title, table, avg, tdsCount, tdsPercent,
            barWidth = 75,
            countScale = d3.scale.linear().range([0, barWidth]).domain([0, data.max]),
            percentScale = d3.scale.linear().range([0, barWidth]).domain([0, data.maxPercent]);
        
        
        function buildTable() {
            table = facet.board.append("table");
            var footer, header = table.append("tr"),
                lines = table.selectAll(".line").data(data.data)
                .enter()
                .append("tr")
                .attr("class", "line")
                .on("click", function (d) {
                    facet.onSelect(d, data);
                });
            header.append("th").text("");
            
            
            
            
            lines.append("td")
                .attr("class", "label")
                .text(function (d) {return d.key + (d.key === 1 ? " review" : " reviews"); });
            
            if (data.maxPercent) {
                header.append("th").text("Proportion");
                tdsPercent = lines.append("td")
                    .attr("class", "bar");

                tdsPercent.append("div")
                        .attr("class", "barBase")
                    .on("mouseover", function (d) {
                        facet.showToolTip('<label>Count: </label><span>' + d.doc_count + "</span></br>");
                    })
                    .on("mouseout", function (d) {
                        facet.hideToolTip();
                    });


                tdsPercent.append("div")
                    .attr("class", "barValue")
                    .on("mouseover", function (d) {
                        facet.showToolTip('<label>Percent: </label><span>' + (d.percent * 100).toFixed(2) + "%" + "</span></br>");
                    })
                    .on("mouseout", function (d) {
                        facet.hideToolTip();
                    })
                    .style({
                        width: function (d) {return percentScale(d.percent) + 'px'; },
                        "background-color": function (d) { return facet.colors.percentDis(d.percent); }
                    });
            }
            header.append("th").text("Count");
            tdsCount = lines.append("td")
                .attr("class", "bar");
            
            tdsCount.append("div")
                    .attr("class", "barBase")
                .on("mouseover", function (d) {
                    facet.showToolTip('<label>Count: </label><span>' + d.doc_count + "</span></br>");
                })
                .on("mouseout", function (d) {
                    facet.hideToolTip();
                });
            
            tdsCount.append("div")
                .attr("class", "barValue")
                .on("mouseover", function (d) {
                    facet.showToolTip('<label>Count: </label><span>' + d.doc_count + "</span></br>");
                })
                .on("mouseout", function (d) {
                    facet.hideToolTip();
                })
                .style({
                    width: function (d) {return countScale(d.doc_count) + 'px'; },
                    "background-color": function (d) { return facet.colors.countDis(d.doc_count); }
                });
            
            lines.append("td")
                .attr("class", "value")
                .text(function (d) {return " " + d.doc_count; });
            header.append("th").text("");
            footer = table.append("tr").attr("class", "footer");
            footer.append("td").text("");
            if (data.maxPercent) {
                footer.append("td").attr("class", "maxValue").text((data.maxPercent * 100).toFixed(3) + '%');
            }
            footer.append("td").attr("class", "maxValue").text(data.max);
            footer.append("td").text("");
        }
        
        facet.build = function () {
            var sum = 0, weightedSum = 0;
            data.data.forEach(function (d) {
                sum += d.doc_count;
                weightedSum += d.doc_count * d.key;
            });
            
            
            buildTable();
        };
        
        
    },
    provider: function (facet, data) {
        'use strict';
        var title, table, avg, tdsCount, tdsPercent,
            barWidth = 30,
            countScale = d3.scale.sqrt().range([0, barWidth]).domain([0, data.max]),
            percentScale = d3.scale.sqrt().range([0, barWidth]).domain([0, data.maxPercent]),
            sortingBy = "count-desc";
        facet.colors.countDis = countColor;
        
        function buildTable() {
            facet.board.select(".base").remove();
            table = facet.board.append("div").attr("class", "base").append("table");
            var footer, header = table.append("tr"),
                lines = table.selectAll(".line").data(data.data)
                .enter()
                .append("tr")
                .attr("class", "line")
                .on("click", function (d) {
                    facet.onSelect(d, data);
                });
            header.append("th").text("");
            
            lines.append("td")
                .attr("class", "label")
                .text(function (d) {return d.key; });
            
            header.append("th").text("#")
                .html("#" +
                            (sortingBy === "count-desc" ? ' <i class="fa fa-sort-amount-desc"></i>' :
                            (sortingBy === "count-asc" ? ' <i class="fa fa-sort-amount-asc"></i>' : "")))
                .on("click", function () {
                    switch (sortingBy) {
                    case "count-desc":
                        data.data.sort(Utils.fieldSort("doc_count", false));
                        sortingBy = "count-asc";
                        break;
                    default:
                        data.data.sort(Utils.fieldSort("doc_count", true));
                        sortingBy = "count-desc";
                        break;
                    }
                    buildTable();
                });
            tdsCount = lines.append("td")
                .attr("class", "bar")
                .on("mouseover", function (d) {
                    facet.showToolTip('<label>Count: </label><span>' + d.doc_count + "</span></br>");
                })
                .on("mouseout", function (d) {
                    facet.hideToolTip();
                });
                
            tdsCount.append("div")
                .attr("class", "barBase")
                .append("div")
                .attr("class", "barValue")
                .style({
                    left: function (d) {return (barWidth - countScale(d.doc_count)) / 2 + 'px'; },
                    top: function (d) {return (barWidth - countScale(d.doc_count)) / 2 + 'px'; },
                    height: function (d) {return countScale(d.doc_count) + 'px'; },
                    width: function (d) {return countScale(d.doc_count) + 'px'; },
                    "background-color": function (d) { return facet.colors.countDis(d.doc_count); }
                });
            
            if (data.maxPercent) {
                header.append("th").html("%" +
                            (sortingBy === "percent-desc" ? ' <i class="fa fa-sort-amount-desc"></i>' :
                            (sortingBy === "percent-asc" ? ' <i class="fa fa-sort-amount-asc"></i>' : "")))
                    .on("click", function () {
                        switch (sortingBy) {
                        case "percent-desc":
                            data.data.sort(Utils.fieldSort("percent", false));
                            sortingBy = "percent-asc";
                            break;
                        default:
                            data.data.sort(Utils.fieldSort("percent", true));
                            sortingBy = "percent-desc";
                            break;
                        }
                        buildTable();
                    });
                tdsPercent = lines.append("td")
                    .attr("class", "bar")
                    .on("mouseover", function (d) {
                        facet.showToolTip('<label>Percent: </label><span>' + (d.percent * 100).toFixed(2) + "%" + "</span></br>");
                    })
                    .on("mouseout", function (d) {
                        facet.hideToolTip();
                    });

                tdsPercent.append("div")
                    .attr("class", "barBase")
                    .append("div")
                    .attr("class", "barValue")
                    .style({
                        left: function (d) {return (barWidth - percentScale(d.percent)) / 2 + 'px'; },
                        top: function (d) {return (barWidth - percentScale(d.percent)) / 2 + 'px'; },
                        height: function (d) {return percentScale(d.percent) + 'px'; },
                        width: function (d) {return percentScale(d.percent) + 'px'; },
                        "background-color": function (d) { return facet.colors.percentDis(d.percent); }
                    });
            }
            
        }
        
        facet.build = function () {
            facet.title.append("span").attr("class", "maxFacet")
                .style("font-weight", "bold")
                .html('<div style="background-color:' + facet.colors.countDis(data.max) + '"></div>' + data.max + " " +
                      (data.maxPercent ? ('<div style="background-color:' + facet.colors.percentDis(data.maxPercent) + '"></div>' + (data.maxPercent * 100).toFixed(2) + "%") : ""));
            buildTable();
        };
    },
    cloud: function (facet, data) {
        'use strict';
        
    }
          
};
        
Tex.directive("cloud", function () {
    'use strict';
    return {
        restrict: "A",
        template: '<div class="loading" ng-show="loading > 0">Loading...</div>',
        scope: {
            data: '=',
            loading: '=',
            search: '=',
            h: '=',
            total: '='
        },
        link: function (scope, elem, attrs) {
            var board = d3.select(elem[0]),
                fill = d3.scale.category20(),
                score = d3.scale.linear();
            function draw(words) {
                board.selectAll("svg").remove();
                board.append("svg")
                    .attr("width", 250)
                    .attr("height", scope.h)
                    .append("g")
                    .attr("transform", "translate(125," + (scope.h / 2) + ")")
                    .selectAll("text")
                    .data(words)
                    .enter().append("text")
                    .style("font-size", function (d) { return d.size + "px"; })
                    .style("fill", function (d, i) {return d.score ? score(d.score) : "hsl(200, 20%, 80%)"; })
                    .style("cursor", "pointer")
                    .attr("text-anchor", "middle")
                    .attr("transform", function (d) {
                        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                    })
                    .text(function (d) { return d.text; })
                    .on("mouseover", function (d) {
                        scope.$parent.showToolTip(
                            '<label>Word: </label><span class"bold">' + d.text + "</span></br>" +
                                (d.score ? '<label>Relevance: </label><span>' + d.score.toFixed(2) + "</span></br>" : "") +
                                '<label>Count: </label><span>' + d.doc_count + "</span></br>" +
                                '<label>Percent: </label><span>' + (d.doc_count / scope.total * 100).toFixed(1) + "%</span></br>"
                        );
                    })
                    .on("mouseout", function (d) {
                        scope.$parent.hideToolTip();
                    })
                    .on("click", function (d) {
                        var t = d.text;
                        if (d.text.indexOf(" ") > -1) {
                            t = '"' + t + '"';
                        }
                        scope.$parent.appendWord(t);
                        
                    });
            }
            scope.$watch(function () { return scope.data; }, function () {
                if (scope.data) {
                    var size = d3.scale.linear().range([10, 35]).domain([0, scope.data.max]);
                    score = d3.scale.linear().range(["#9aafb9", "#FF5722"]).domain([d3.min(scope.data.data, function (d) {return d.score; }), d3.max(scope.data.data, function (d) {return d.score; })]);
                    d3.layout.cloud().size([250, scope.h])
                        .words(scope.data.data.map(function (d) {return {text: d.key, doc_count: d.doc_count, size: d.doc_count, score: d.score}; }))
                            .padding(5)
                            .rotate(function () { return 0; })
                            .fontSize(function (d) { return size(d.size); })
                            .on("end", draw)
                            .start();
                }
            });
        }
    };
});


Tex.directive("histogram", function () {
    'use strict';
    return {
        restrict: "A",
        template: '<div class="controls"><span ng-click="setShow(\'%\')" nh ng-class="{selected: show ===\'%\' }">%</span><span ng-click="setShow(\'#\')" ng-class="{selected: show ===\'#\' }">#</span></div>',
        scope: {
            data: '=',
            loading: '=',
            filter: '='
        },
        link: function (scope, elem, attrs) {
            var board = d3.select(elem[0]), brush, gBrush,
                margin = {top: 0, right: 0, bottom: 10, left: 0},
                width = 775,
                height = 30,
                innerWidth = width - margin.left - margin.right,
                innerHeight = height - margin.top - margin.bottom,
                x = d3.scale.ordinal().rangeRoundBands([0, innerWidth]),
                y = d3.scale.linear().rangeRound([innerHeight, 0]),
                yValue = function (d) { if (d.isGlobal) { scope.show = "#"; } return scope.show === "%" ? d.percent : d.doc_count; },
                
                svg = board.append("svg")
                .attr("width", width)
                .attr("height", height)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            svg.append("line")
                .attr("x1", margin.left)
                .attr("x2", innerWidth)
                .attr("y1", innerHeight + margin.top + 1)
                .attr("y2", innerHeight + margin.top + 1);
            
            scope.show = "%";
            
            
            
            
            function brushended() {
                if (!d3.event.sourceEvent) {
                    return;
                }
                d3.event.sourceEvent.stopPropagation();
                
                var i, start = brush.extent()[0],
                    end = brush.extent()[1],
                    objStart, objEnd,
                    idxStart = -1,
                    idxEnd = -1;
                
                for (i = 0; i < x.range().length; i += 1) {
                    if (x.range()[i] > start && idxStart < 0) {
                        idxStart = i === 0 ? 0 : i - 1;
                    }
                    if (x.range()[i] >= end && idxEnd < 0) {
                        idxEnd = i - 1;
                    }
                }
                objStart = {stamp: scope.data[idxStart].key, desc: scope.data[idxStart].key_as_string};
                if (idxEnd < 0) {
                    idxEnd = x.range().length - 1;
                    objEnd = {stamp: "*", desc: scope.data[idxEnd].key_as_string};
                } else {
                    objEnd = {stamp: scope.data[idxEnd + 1].key, desc: scope.data[idxEnd].key_as_string};
                }
                
                d3.select(this).transition()
                    .call(brush.extent([x(idxStart), x(idxEnd) + x.rangeBand()]))
                    .call(brush.event);
                
                scope.$parent.setDate(objStart, objEnd);
            }
            
             
            brush = d3.svg.brush()
                    .x(x)
                    .on("brushend", brushended);
  
            function refresh(data) {
                var xAxis, bar, barData;
                
                x.domain(scope.data.map(function (d, idx) {return idx; }));
                y.range([innerHeight, innerHeight - 1, 0]).domain([0, 0.000000001, d3.max(data, yValue)]);
                
                
                svg.selectAll(".bar").remove();
                
                barData = svg.selectAll(".bar").data(data);
                
                bar = barData.enter().append("g")
                        .attr("class", "bar")
                        .append("rect")
                        .attr("class", "barRect")
                        .attr("x", 1)
                    .on("mouseover", function (d) {
                        scope.$parent.showToolTip(
                            '<label>Month: </label><span clas="bold">' + d.key_as_string + "</span></br>" +
                                '<label>Count: </label><span>' + d.doc_count + "</span></br>" +
                                (d.percent ? "<label>Percent: </label><span>" + (d.percent * 100).toFixed(2) + "%</span></br>" : "") +
                                (d.percent ? "<label>Global: </label><span>" + d.globalValue + "</span></br>" : "")
                        );
                    })
                    .on("mouseout", function (d) {
                        scope.$parent.hideToolTip();
                    });
                
                barData.exit().remove();
                
                bar.each(function (d, idx) {
                    if (d.key_as_string.substring(0, 3) === "Jul") {
                        
                        d3.select(this.parentNode).append("text")
                            .attr("y", innerHeight - y(yValue(d)) + 9)
                            .attr("text-anchor", "middle")
                            .text(d.key_as_string.split(" ")[1].trim());
                    }
                    if (d.key_as_string.substring(0, 3) === "Jan") {
                        d3.select(this.parentNode).append("line")
                            .attr("y1", (-y(yValue(d))))
                            .attr("y2", height);
                    }
                });
                
                svg.selectAll(".bar")
                    .attr("transform", function (d, i) { return "translate(" + x(i) + "," + y(yValue(d)) + ")"; });
                
                svg.selectAll(".barRect")
                    .attr("title", function (d) {return d.key_as_string + ":" + yValue(d); })
                    .attr("width", Math.floor((innerWidth / data.length)) - 1)
                    .attr("height", function (d) {
                        return innerHeight - y(yValue(d));
                    })
                    .attr("fill", function (d) {
                        if (d.key < scope.filter.date.from.stamp || d.key >= scope.filter.date.to.stamp) {
                            return "#f0f0f0";
                        }
                        return d.percent ? percentColor(d.percent) : countColor(d.doc_count);
                    });
                
                var idxS = scope.data.findIndex(function (d) { return d.key_as_string === scope.filter.date.from.desc; });
                var idxE = scope.data.findIndex(function (d) { return d.key_as_string === scope.filter.date.to.desc; });
                
                if(idxS > 0 || idxE < scope.data.length -1) {
                    brush.extent([x(idxS),
                              x(idxE) + x.rangeBand()]);
                }
                svg.selectAll(".brush").remove();
                
                gBrush = svg.append("g")
                    .attr("class", "brush")
                    .call(brush)
                    .call(brush.event);
            
                gBrush.selectAll("rect")
                    .attr("height", "9px")
                    //.attr("y", "21px");
            }
            
            scope.setShow = function (to) {
                scope.show = to;
                refresh(scope.data);
            };
            
            scope.$watch(function () { return scope.data; }, function (newData) {
                if (scope.data) {
                    refresh(newData);
                }
            });
        }
    };
});

Tex.directive("facet", function () {
    'use strict';
    return {
        restrict: "A",
        template: '<h1>{{data.facet}}</h1><div class="loading" ng-show="loading > 0">Loading...</div>',
        scope: {
            data: '=',
            loading: '='
        },
        link: function (scope, elem, attrs) {
            var facet = {
                    board: d3.select(elem[0]),
                    title: d3.select(elem[0]).select("h1"),
                    colors: {
                        percentDis: percentColor,
                        countDis: countColor
                    },
                    build: function () {
                        facet.board.append('div').text('todo');
                    },
                    onSelect: function (d, facet) {
                        scope.$parent.$parent.addFacetFilter(d, facet);
                    },
                    showToolTip: function (text) {
                        scope.$parent.$parent.showToolTip(text);
                    },
                    hideToolTip: function (text) {
                        if (scope.$parent.$parent !== null) {
                            scope.$parent.$parent.hideToolTip();
                        }
                    }
                };
            if (facets[scope.data.directive]) {
                facets[scope.data.directive](facet, scope.data);
            }
            
            facet.build();
        }
    };
});


