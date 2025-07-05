jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;

describe("Visible.js", function() {

    beforeEach(function() {
        // Clean up any existing instances and watchers
        if (typeof Visible !== 'undefined') {
            Visible.destroyAll();
        }
        // Remove test elements
        $('.test-elem, .test-existing, .test-visible, .test-invisible').remove();
    });

    afterEach(function() {
        // Clean up after each test
        if (typeof Visible !== 'undefined') {
            Visible.destroyAll();
        }
    });

    describe("Core Visibility Detection", function() {

        describe("Basic visibility detection:", function() {
            var selector = ".test-visible";

            it("should detect when element becomes visible", function(done) {
                var $elem = $("<div class='test-visible' style='height: 100px; width: 100px;'></div>");
                $("body").append($elem);

                var instance = new Visible({
                    threshold: 0.1
                });

                instance.observe($elem[0], {}, function(element) {
                    expect(element).toBe($elem[0]);
                    done();
                });
            });

            it("should detect when element becomes invisible", function(done) {
                var $elem = $("<div class='test-visible' style='height: 100px; width: 100px;'></div>");
                $("body").append($elem);

                var instance = new Visible({
                    threshold: 0.1
                });

                var visibleCalled = false;
                instance.observe($elem[0], {
                    onVisible: function(element) {
                        visibleCalled = true;
                        // Hide the element after it becomes visible
                        setTimeout(function() {
                            $elem.hide();
                        }, 100);
                    },
                    onInvisible: function(element) {
                        expect(visibleCalled).toBe(true);
                        expect(element).toBe($elem[0]);
                        done();
                    }
                });
            });
        });

        describe("Threshold options:", function() {
            it("should respect threshold settings", function(done) {
                var $elem = $("<div class='test-visible' style='height: 200px; width: 200px;'></div>");
                $("body").append($elem);

                var instance = new Visible({
                    threshold: 0.5 // 50% visibility required
                });

                instance.observe($elem[0], {}, function(element) {
                    expect(element).toBe($elem[0]);
                    done();
                });
            });

            it("should handle multiple thresholds", function(done) {
                var $elem = $("<div class='test-visible' style='height: 200px; width: 200px;'></div>");
                $("body").append($elem);

                var instance = new Visible({
                    threshold: [0, 0.25, 0.5, 0.75, 1.0]
                });

                var callCount = 0;
                instance.observe($elem[0], {}, function(element) {
                    callCount++;
                    if (callCount === 1) {
                        expect(element).toBe($elem[0]);
                        done();
                    }
                });
            });
        });

        describe("Once option:", function() {
            it("should fire callback only once when once: true", function(done) {
                var $elem = $("<div class='test-visible' style='height: 100px; width: 100px;'></div>");
                $("body").append($elem);

                var instance = new Visible();
                var callCount = 0;

                instance.observe($elem[0], { once: true }, function(element) {
                    callCount++;
                });

                setTimeout(function() {
                    // Try to trigger visibility again
                    $elem.hide();
                    setTimeout(function() {
                        $elem.show();
                        setTimeout(function() {
                            expect(callCount).toBe(1);
                            done();
                        }, 200);
                    }, 100);
                }, 100);
            });

            it("should fire callback multiple times when once: false", function(done) {
                var $elem = $("<div class='test-visible' style='height: 100px; width: 100px;'></div>");
                $("body").append($elem);

                var instance = new Visible();
                var callCount = 0;

                instance.observe($elem[0], { once: false }, function(element) {
                    callCount++;
                    if (callCount === 1) {
                        // Hide and show again
                        setTimeout(function() {
                            $elem.hide();
                            setTimeout(function() {
                                $elem.show();
                            }, 100);
                        }, 100);
                    } else if (callCount === 2) {
                        expect(callCount).toBe(2);
                        done();
                    }
                });
            });
        });
    });

    describe("Document-level API", function() {

        describe("document.visible():", function() {
            it("should watch for elements matching selector to become visible", function(done) {
                var watcher = document.visible(".test-document-visible", function(element) {
                    expect(element.className).toContain("test-document-visible");
                    watcher.destroy();
                    done();
                });

                setTimeout(function() {
                    var $elem = $("<div class='test-document-visible' style='height: 100px; width: 100px;'></div>");
                    $("body").append($elem);
                }, 100);
            });

            it("should handle existing elements when existing: true", function(done) {
                var $elem = $("<div class='test-existing-visible' style='height: 100px; width: 100px;'></div>");
                $("body").append($elem);

                var watcher = document.visible(".test-existing-visible", { existing: true }, function(element) {
                    expect(element).toBe($elem[0]);
                    watcher.destroy();
                    done();
                });
            });

            it("should respect once option", function(done) {
                var callCount = 0;
                var watcher = document.visible(".test-once-visible", { once: true }, function(element) {
                    callCount++;
                });

                setTimeout(function() {
                    var $elem1 = $("<div class='test-once-visible' style='height: 100px; width: 100px;'></div>");
                    var $elem2 = $("<div class='test-once-visible' style='height: 100px; width: 100px;'></div>");
                    $("body").append($elem1).append($elem2);

                    setTimeout(function() {
                        expect(callCount).toBe(1);
                        watcher.destroy();
                        done();
                    }, 300);
                }, 100);
            });

            it("should handle timeout option", function(done) {
                var callCount = 0;
                var watcher = document.visible(".test-timeout-visible", { 
                    timeout: 200,
                    once: true 
                }, function(element) {
                    callCount++;
                    if (element === null) {
                        expect(callCount).toBe(1);
                        done();
                    }
                });

                // Don't add any elements, let it timeout
            });
        });

        describe("document.invisible():", function() {
            it("should watch for elements to become invisible", function(done) {
                var $elem = $("<div class='test-invisible-elem' style='height: 100px; width: 100px;'></div>");
                $("body").append($elem);

                var watcher = document.invisible(".test-invisible-elem", { existing: true }, function(element) {
                    expect(element).toBe($elem[0]);
                    watcher.destroy();
                    done();
                });

                setTimeout(function() {
                    $elem.hide();
                }, 100);
            });
        });

        describe("document.unobserveVisible():", function() {
            it("should stop watching for specified selector", function(done) {
                var callCount = 0;
                var watcher = document.visible(".test-unobserve", function(element) {
                    callCount++;
                });

                setTimeout(function() {
                    document.unobserveVisible(".test-unobserve");
                    
                    setTimeout(function() {
                        var $elem = $("<div class='test-unobserve' style='height: 100px; width: 100px;'></div>");
                        $("body").append($elem);
                        
                        setTimeout(function() {
                            expect(callCount).toBe(0);
                            done();
                        }, 200);
                    }, 100);
                }, 100);
            });
        });
    });

    describe("Element-level API", function() {

        describe("Element.prototype.visible():", function() {
            it("should make element observable for visibility", function(done) {
                var $elem = $("<div class='test-element-visible' style='height: 100px; width: 100px;'></div>");
                $("body").append($elem);

                $elem[0].visible(function(element) {
                    expect(element).toBe($elem[0]);
                    done();
                });
            });

            it("should accept options", function(done) {
                var $elem = $("<div class='test-element-options' style='height: 100px; width: 100px;'></div>");
                $("body").append($elem);

                $elem[0].visible({ once: true }, function(element) {
                    expect(element).toBe($elem[0]);
                    done();
                });
            });
        });

        describe("Element.prototype.invisible():", function() {
            it("should detect when element becomes invisible", function(done) {
                var $elem = $("<div class='test-element-invisible' style='height: 100px; width: 100px;'></div>");
                $("body").append($elem);

                $elem[0].invisible(function(element) {
                    expect(element).toBe($elem[0]);
                    done();
                });

                setTimeout(function() {
                    $elem.hide();
                }, 100);
            });
        });

        describe("Element.prototype.isElementVisible():", function() {
            it("should return visibility state", function(done) {
                var $elem = $("<div class='test-element-invisible' style='height: 100px; width: 100px;'></div>");
                $("body").append($elem);

                $elem[0].visible(function(element) {
                    setTimeout(function() {
                        expect($elem[0].isElementVisible()).toBe(true);
                        done();
                    }, 50);
                });
            });
        });

        describe("Element.prototype.unobserveVisible():", function() {
            it("should stop observing element", function(done) {
                var $elem = $("<div class='test-element-unobserve' style='position: fixed; top: 10px; left: 10px; height: 100px; width: 100px;'></div>");
                $("body").append($elem);

                var callCount = 0;
                var callback = function() {
                    callCount++;
                };

                $elem[0].visible(callback);

                // Give the IntersectionObserver time to fire.
                setTimeout(function() {
                    // At this point, the element should have been visible and the callback fired.
                    expect(callCount).toBe(1);

                    // Now, unobserve it.
                    $elem[0].unobserveVisible(callback);

                    // Hide and show to try and trigger again.
                    $elem.hide();
                    setTimeout(function() {
                        $elem.show();

                        // Wait to ensure the callback is NOT fired again.
                        setTimeout(function() {
                            expect(callCount).toBe(1);
                            $elem.remove(); // Clean up the element
                            done();
                        }, 300);
                    }, 100);
                }, 300);
            });
        });
    });

    describe("jQuery Plugin", function() {
        
        // Skip jQuery tests if jQuery is not available
        if (typeof window.jQuery === "undefined") {
            it("jQuery not available, skipping jQuery tests", function() {
                expect(true).toBe(true);
            });
            return;
        }

        describe("$.fn.visible():", function() {
            it("should work with jQuery elements", function(done) {
                var $elem = $("<div class='test-jquery-visible' style='position: fixed; top: 10px; left: 10px; height: 100px; width: 100px;'></div>");
                $("body").append($elem);

                $elem.visible(function(element) {
                    expect(element).toBe($elem[0]);
                    done();
                });
            });

            it("should work with multiple elements", function(done) {
                var $elem1 = $("<div class='test-jquery-multiple' style='position: fixed; top: 10px; left: 10px; height: 100px; width: 100px;'></div>");
                var $elem2 = $("<div class='test-jquery-multiple' style='position: fixed; top: 120px; left: 10px; height: 100px; width: 100px;'></div>");
                $("body").append($elem1).append($elem2);

                var callCount = 0;
                $(".test-jquery-multiple").visible(function(element) {
                    callCount++;
                    if (callCount === 2) {
                        expect(callCount).toBe(2);
                        done();
                    }
                });
            });
        });

        describe("$.fn.invisible():", function() {
            it("should detect when jQuery elements become invisible", function(done) {
                var $elem = $("<div class='test-jquery-invisible' style='position: fixed; top: 10px; left: 10px; height: 100px; width: 100px;'></div>");
                $("body").append($elem);

                $elem.invisible(function(element) {
                    expect(element).toBe($elem[0]);
                    done();
                });

                setTimeout(function() {
                    $elem.hide();
                }, 100);
            });
        });

        describe("$.fn.isVisible():", function() {
            it("should return visibility state for jQuery elements", function(done) {
                var $elem = $("<div class='test-jquery-state' style='position: fixed; top: 10px; left: 10px; height: 100px; width: 100px;'></div>");
                $("body").append($elem);

                $elem.visible(function(element) {
                    setTimeout(function() {
                        expect($elem.isVisible()).toBe(true);
                        done();
                    }, 50);
                });
            });
        });
    });

    describe("Visible Class Methods", function() {

        describe("Instance management:", function() {
            it("should track instances", function() {
                var instance1 = new Visible();
                var instance2 = new Visible();
                
                var instances = Visible.getInstances();
                expect(instances.length >= 2).toBe(true);
                
                instance1.destroy();
                instance2.destroy();
            });

            it("should destroy all instances", function() {
                var instance1 = new Visible();
                var instance2 = new Visible();
                
                Visible.destroyAll();
                
                var instances = Visible.getInstances();
                expect(instances.length).toBe(0);
            });
        });

        describe("Visible.create():", function() {
            it("should create new instance", function() {
                var instance = Visible.create({ threshold: 0.5 });
                expect(instance).toBeDefined();
                expect(instance.options.threshold).toEqual([0.5]);
                instance.destroy();
            });
        });

        describe("Instance methods:", function() {
            var instance;

            beforeEach(function() {
                instance = new Visible();
            });

            afterEach(function() {
                if (instance && !instance.isDestroyed) {
                    instance.destroy();
                }
            });

            it("should observe elements", function() {
                var $elem = $("<div class='test-instance-observe' style='height: 100px; width: 100px;'></div>");
                $("body").append($elem);

                var result = instance.observe($elem[0], {}, function() {});
                expect(result).toBe(instance); // Should return instance for chaining
            });

            it("should unobserve elements", function() {
                var $elem = $("<div class='test-instance-unobserve' style='height: 100px; width: 100px;'></div>");
                $("body").append($elem);

                var callback = function() {};
                instance.observe($elem[0], {}, callback);
                
                var result = instance.unobserve($elem[0], callback);
                expect(result).toBe(instance); // Should return instance for chaining
            });

            it("should check if element is visible", function() {
                var $elem = $("<div class='test-instance-check' style='height: 100px; width: 100px;'></div>");
                $("body").append($elem);

                var isVisible = instance.isVisible($elem[0]);
                expect(typeof isVisible).toBe('boolean');
            });

            it("should get observed elements", function() {
                var $elem = $("<div class='test-instance-get' style='height: 100px; width: 100px;'></div>");
                $("body").append($elem);

                instance.observe($elem[0], {}, function() {});
                
                var observedElements = instance.getObservedElements();
                expect(observedElements).toContain($elem[0]);
            });

            it("should update options", function() {
                var result = instance.updateOptions({ threshold: 0.8 });
                expect(result).toBe(instance); // Should return instance for chaining
                expect(instance.options.threshold).toEqual(0.8);
            });

            it("should disconnect observer", function() {
                var result = instance.disconnect();
                expect(result).toBe(instance); // Should return instance for chaining
            });
        });
    });

    describe("Error Handling", function() {
        
        it("should handle invalid selectors gracefully", function() {
            expect(function() {
                document.visible("invalid[selector", function() {});
            }).not.toThrow();
        });

        it("should handle callback errors gracefully", function(done) {
            var $elem = $("<div class='test-error-handling' style='height: 100px; width: 100px;'></div>");
            $("body").append($elem);

            // This should not crash the test
            var watcher = document.visible(".test-error-handling", function(element) {
                watcher.destroy();
                throw new Error("Test error");
            });

            setTimeout(function() {
                expect(true).toBe(true); // If we reach here, error was handled
                done();
            }, 300);
        });

        it("should handle operations on destroyed instances", function() {
            var instance = new Visible();
            instance.destroy();
            
            expect(function() {
                instance.observe(document.body, {}, function() {});
            }).not.toThrow();
        });
    });

    describe("Performance and Memory", function() {
        
        it("should clean up properly on destroy", function() {
            var instance = new Visible();
            var $elem = $("<div class='test-cleanup' style='height: 100px; width: 100px;'></div>");
            $("body").append($elem);

            instance.observe($elem[0], {}, function() {});
            
            var observedBefore = instance.getObservedElements().length;
            expect(observedBefore).toBe(1);
            
            instance.destroy();
            expect(instance.isDestroyed).toBe(true);
        });

        it("should handle multiple instances efficiently", function() {
            var instances = [];
            for (var i = 0; i < 10; i++) {
                instances.push(new Visible());
            }
            
            expect(Visible.getInstances().length >= 10).toBe(true);
            
            instances.forEach(function(instance) {
                instance.destroy();
            });
            
            expect(Visible.getInstances().length).toBe(0);
        });
    });
});