/// <reference path="_ref.d.ts" />

class NestBasic implements Nest.INest {

    modules: Array < Nest.AppModule > ;

    constructor() {
        this.modules = [];
    }
}

class NestBootstraperBasic implements Nest.IBootstraper {

    steps: Array < any > ;
    app: Nest.INest;
    constructor() {
        this.steps = [];
        this.app = new NestBasic();
    }

    register(step: (app: Nest.INest, next: () => void) => any);
    register(steps: Array < (app: Nest.INest, next: () => void) => any > );
    register(x: any) {
        this.steps.push(x);
    }

    run(app: Nest.INest, steps: Array < any > , i: number, add: () => void, sub: () => void) {
        if (steps.length > i) {
            var f = steps[i];

            if (Array.isArray(f)) {
                this.run(app, f, 0, add, sub);
                this.run(app, steps, i + 1, add, sub);
            } else {
                add();

                var next = steps.length == i + 1 ? sub : () => {
                    this.run(app, steps, i + 1, add, sub);
                    sub();
                };

                var fnext = next;

                var r = f(app, () => {
                    fnext();
                });

                if (r !== true) {

                    fnext = () => {};
                    // this dance with fnext and next is done
                    // so if they retun not true and then call done
                    // it will do nothing and will not screw up the 

                    if (r === undefined || r === app)
                        next();
                    else if (r === Object(r) && typeof r.then === "function")
                        r.then(next);
                    else
                        next();
                }
            }
        }
    }

    wait(done ? : () => any): Nest.IPromise < any > {

        var i = 0;
        var add = () => {
            i += 1;
        };
        var sub;
        var result

        if (done !== undefined)
            sub = () => {
                i -= 1;
                if (i === 0)
                    done();
            };
        else {
            var qreg = this.app.modules.filter((v, i, a) => {
                return v.name === 'IAsync';
            })[0];

            if (!qreg)
                throw "IAsync was not found in nest application";

            var q: Nest.IAsync = qreg.instance;

            var d = q.defer < any > ();

            sub = () => {
                i -= 1;
                if (i === 0)
                    d.resolve(this);
            }

            result = d.promise;
        }

        this.run(this.app, this.steps, 0, add, sub);
        this.steps = [];
        return result;
    }
    start() {
        this.run(this.app, this.steps, 0, () => {}, () => {});
        this.steps = [];
    }
}

module.exports = NestBootstraperBasic;