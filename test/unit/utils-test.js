'use strict';
/* jshint expr: true */

var mockery = require('mockery');
var sinon = require('sinon');
var _ = require('lodash');
const chai = require('chai');
const expect = require('chai').expect;



describe('utils', function() {
    describe('updateYearStats', function() {
        var utils;
        var couchbaseClientMock;
        var movieBucketMock;

        before(function () {
            mockery.enable({
                useCleanCache: true
            });
        });
        before(function () {
            movieBucketMock = {
                get: sinon.stub()
            };
            couchbaseClientMock = {
                getBucket: sinon.stub().returns(movieBucketMock)
            };
            mockery.registerAllowables(['../../lib/utils.js', 'lodash', 'json2csv']);
            var config = {
                couchbase: {
                    buckets: {
                        'movies-dev': {
                            name: 'movies'
                        }
                    }
                }

            };
            mockery.registerMock('config', config);
            mockery.registerMock('./logger.js', function () {
                return {error: sinon.stub()};
            });
            mockery.registerMock('./couchbase/client.js', couchbaseClientMock);
            utils = require('../../lib/utils.js');

        });

        after(function () {
            mockery.deregisterAll();
        });

        it('should add counter to stats.yearCounts if they exist and counter is greater than 0', function () {
            var counter = 1;
            var initialStats = {
                yearCounts: {
                    2019: 1
                }
            };
            var expectedStats = {
                yearCounts: {
                    2019: 2
                }
            };
            var result = utils.updateYearStats(counter, initialStats, 2019);
            expect(result).to.eql(expectedStats.yearCounts);
        });

        it('should add counter to stats.yearCounts if they exist and counter equals 0', function () {
            var counter = 0;
            var initialStats = {
                yearCounts: {
                    2019: 1
                }
            };
            var expectedStats = {
                yearCounts: {
                    2019: 1
                }
            };
            var result = utils.updateYearStats(counter, initialStats, 2019);
            expect(result).to.eql(expectedStats.yearCounts);
        });

        it('should set stats.yearCounts to 1 if counter is greater than 0 and stats.yearCounts does not exist for that year', function () {
            var counter = 1;
            var initialStats = {
                yearCounts: {}
            };
            var expectedStats = {
                yearCounts: {
                    2019: 1
                }
            };
            var result = utils.updateYearStats(counter, initialStats, 2019);
            expect(result).to.eql(expectedStats.yearCounts);
        });

        it('should do nothing if counter is -1 and stats.yearCounts does not exist for that year', function () {
            var counter = -1;
            var initialStats = {
                yearCounts: {}
            };
            var expectedStats = {
                yearCounts: {
                }
            };
            var result = utils.updateYearStats(counter, initialStats, 2019);
            expect(result).to.eql(expectedStats.yearCounts);
        });
        it('should remove the year entry in stats.yearCounts if the year entry ends up being 0', function () {
            var counter = -1;
            var initialStats = {
                yearCounts: {
                    2019: 1
                }
            };
            var expectedStats = {
                yearCounts: {
                }
            };
            var result = utils.updateYearStats(counter, initialStats, 2019);
            expect(result).to.eql(expectedStats.yearCounts);
        });

    });

    describe('updateFormatsByYearStats', function() {
        var utils;
        var couchbaseClientMock;
        var movieBucketMock;

        before(function () {
            mockery.enable({
                useCleanCache: true
            });
        });
        before(function () {
            movieBucketMock = {
                get: sinon.stub()
            };
            couchbaseClientMock = {
                getBucket: sinon.stub().returns(movieBucketMock)
            };
            mockery.registerAllowables(['../../lib/utils.js', 'lodash', 'json2csv']);
            var config = {
                couchbase: {
                    buckets: {
                        'movies-dev': {
                            name: 'movies'
                        }
                    }
                }

            };
            mockery.registerMock('config', config);
            mockery.registerMock('./logger.js', function () {
                return {error: sinon.stub()};
            });
            mockery.registerMock('./couchbase/client.js', couchbaseClientMock);
            utils = require('../../lib/utils.js');

        });

        it('should add counter to the In Theaters number for that year and format if they exist and counter is greater than 0', function () {
            var counter = 1;
            var format = 'In Theaters';
            var initialStats =
            {
                formatsByYear: {
                    2019: {
                        'In Theaters': 1,
                            'Video': 0
                    }
                }
            };
            var expectedStats = {
                formatsByYear: {
                    2019: {
                        'In Theaters': 2,
                        'Video': 0
                    }
                }
            };
            var result = utils.updateFormatsByYearStats(initialStats, 2019, format, counter);
            expect(result).to.eql(expectedStats);
        });

        it('should add counter to the In Theaters number for that year and format if they exist and counter is 0', function () {
            var counter = 0;
            var format = 'In Theaters';
            var initialStats =
                {
                    formatsByYear: {
                        2019: {
                            'In Theaters': 1,
                            'Video': 0
                        }
                    }
                };
            var expectedStats = {
                formatsByYear: {
                    2019: {
                        'In Theaters': 1,
                        'Video': 0
                    }
                }
            };
            var result = utils.updateFormatsByYearStats(initialStats, 2019, format, counter);
            expect(result).to.eql(expectedStats);
        });

        it('should add counter to the Video number for that year and format if they exist and counter is greater than 0', function () {
            var counter = 1;
            var format = 'Video';
            var initialStats =
                {
                    formatsByYear: {
                        2019: {
                            'In Theaters': 1,
                            'Video': 0
                        }
                    }
                };
            var expectedStats = {
                formatsByYear: {
                    2019: {
                        'In Theaters': 1,
                        'Video': 1
                    }
                }
            };
            var result = utils.updateFormatsByYearStats(initialStats, 2019, format, counter);
            expect(result).to.eql(expectedStats);
        });

        it('should add counter to the Video number for that year and format if they exist and counter is 0', function () {
            var counter = 0;
            var format = 'Video';
            var initialStats =
                {
                    formatsByYear: {
                        2019: {
                            'In Theaters': 1,
                            'Video': 0
                        }
                    }
                };
            var expectedStats = {
                formatsByYear: {
                    2019: {
                        'In Theaters': 1,
                        'Video': 0
                    }
                }
            };
            var result = utils.updateFormatsByYearStats(initialStats, 2019, format, counter);
            expect(result).to.eql(expectedStats);
        });

        it('should set the stats for that year and format to 1 if there was no value before', function () {
           var counter = 1;
           var format = 'In Theaters';
            var initialStats =
                {
                    formatsByYear: {
                        2019: {
                            'Video': 0
                        }
                    }
                };
            var expectedStats = {
                formatsByYear: {
                    2019: {
                        'In Theaters': 1,
                        'Video': 0
                    }
                }
            };
            var result = utils.updateFormatsByYearStats(initialStats, 2019, format, counter);
            expect(result).to.eql(expectedStats);
        });

        it('should set the stats for that year and format to 1 if there was no value before', function () {
            var counter = 1;
            var format = 'Video';
            var initialStats =
                {
                    formatsByYear: {
                        2019: {
                            'In Theaters': 0
                        }
                    }
                };
            var expectedStats = {
                formatsByYear: {
                    2019: {
                        'In Theaters': 0,
                        'Video': 1
                    }
                }
            };
            var result = utils.updateFormatsByYearStats(initialStats, 2019, format, counter);
            expect(result).to.eql(expectedStats);
        });

        it('should initialize stats for that year if it does not exist and set the requested format to 1 if counter is greater than 0', function () {
            var counter = 1;
            var format = 'Video';
            var initialStats =
                {
                    formatsByYear: {
                    }
                };
            var expectedStats = {
                formatsByYear: {
                    2019: {
                        'In Theaters': 0,
                        'Video': 1
                    }
                }
            };
            var result = utils.updateFormatsByYearStats(initialStats, 2019, format, counter);
            expect(result).to.eql(expectedStats);
        });

        it('should initialize stats for that year if it does not exist and set the requested format to 1 if counter is greater than 0', function () {
            var counter = 1;
            var format = 'In Theaters';
            var initialStats =
                {
                    formatsByYear: {
                    }
                };
            var expectedStats = {
                formatsByYear: {
                    2019: {
                        'In Theaters': 1,
                        'Video': 0
                    }
                }
            };
            var result = utils.updateFormatsByYearStats(initialStats, 2019, format, counter);
            expect(result).to.eql(expectedStats);
        });

    });

    describe('couchbase', function () {
        var utils;
        var couchbaseClientMock;
        var movieBucketMock;

        before(function () {
            mockery.enable({
                useCleanCache: true
            });
        });

        before(function () {
            movieBucketMock = {
                get: sinon.stub()
            };
            couchbaseClientMock = {
                getBucket: sinon.stub().returns(movieBucketMock)
            };
            mockery.registerAllowables(['../../lib/movie-utils.js', 'lodash', 'json2csv']);
            var config = {
                couchbase: {
                    buckets: {
                        'movies-dev': {
                            name: 'movies'
                    }}
                }

            };

            mockery.resetCache();
            mockery.deregisterAll();
            mockery.registerMock('config', config);
            mockery.registerMock('./logger.js', function () {
                return {error: sinon.stub()};
            });
            mockery.registerMock('./couchbase/client.js', couchbaseClientMock);
            utils = require('../../lib/movie-utils.js');
        });

        after(function () {
            mockery.deregisterAll();
            mockery.disable();
        });

        it('should work', function () {

        });
    });
});