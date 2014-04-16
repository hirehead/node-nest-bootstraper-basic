/// <reference path="_ref.d.ts" />

class NestBasic implements Nest.INest {

    q: Nest.IAsync;
    container: Nest.IContainer;
    data: {
        [key: string]: any
    };

    constructor() {
        this.data = {};
    }
}

class NestBootstrap implements Nest.IBootstrap {

    steps: Array < any > ;
    app: Nest.INest;
    constructor() {
        this.steps = [];
        this.app = new NestBasic();
    }

    register(step: (app ? : Nest.INest, next ? : () => void) => any): Nest.IBootstrap;
    register(step: (app ? : Nest.INest) => Nest.IPromise < Nest.INest > ): Nest.IBootstrap;
    register(step: (app ? : Nest.INest) => Nest.INest): Nest.IBootstrap;
    register(steps: Array < (app ? : Nest.INest, next ? : () => void) => any > ): Nest.IBootstrap;
    register(x: any): Nest.IBootstrap {
        this.steps.push(x);
        return this;
    }

    run(app: Nest.INest, steps: Array < any > , i: number, add: () => void, sub: () => void) {
        if (steps.length > i) {
            var f = steps[i];

            if (Array.isArray(f)) {
                this.run(app, f, 0, add, sub);
                this.run(app, steps, i + 1, add, sub);
            } else {
                add();
                var fnext = steps.length == i + 1 ? sub : () => {
                    this.run(app, steps, i + 1, add, sub);
                    sub();
                };

                var r = f(app, fnext);
                if (r !== true) {
                    if (r === undefined || r === app)
                        fnext();
                    else if (r === Object(r) && typeof r.then === "function")
                        r.then(fnext);
                    else
                        fnext();
                }
            }
        }
    }

    start(done ? : (bootsrap ? : Nest.IBootstrap) => any): Nest.IPromise < Nest.IBootstrap > {

        var i = 0;
        var add = () => {
            i += 1;
        };

        if (done !== undefined) {

            var sub = () => {
                i -= 1;
                if (i === 0) {
                    this.steps = [];
                    done(this);
                }
            }
            this.run(this.app, this.steps, 0, add, sub);

            return undefined;
        } else {

            var d = this.app.q.defer < Nest.IBootstrap > ();

            var sub = () => {
                i -= 1;
                if (i === 0) {
                    this.steps = [];
                    d.resolve(this);
                }
            }
            this.run(this.app, this.steps, 0, add, sub);

            return d.promise;
        }
    }
    continue (): Nest.IBootstrap {
        this.run(this.app, this.steps, 0, () => {}, () => {});
        this.steps = [];
        return this;
    }
}

module.exports.NestBootstrap = NestBootstrap;