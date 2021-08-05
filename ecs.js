//https://github.com/EnderShadow8/wolf-ecs/tree/f75f8b144351d413d0b232987c075a9f4dcaa807
//MIT
class t {
    arr;
    constructor(t) {
        this.arr = t
    }
}
const n = {
        int8: new t(Int8Array),
        i8: new t(Int8Array),
        char: new t(Int8Array),
        uint8: new t(Uint8Array),
        u8: new t(Uint8Array),
        uchar: new t(Uint8Array),
        int16: new t(Int16Array),
        i16: new t(Int16Array),
        short: new t(Int16Array),
        uint16: new t(Uint16Array),
        u16: new t(Uint16Array),
        ushort: new t(Uint16Array),
        int32: new t(Int32Array),
        i32: new t(Int32Array),
        int: new t(Int32Array),
        uint32: new t(Uint32Array),
        u32: new t(Uint32Array),
        uint: new t(Uint32Array),
        float32: new t(Float32Array),
        f32: new t(Float32Array),
        float: new t(Float32Array),
        float64: new t(Float64Array),
        f64: new t(Float64Array),
        double: new t(Float64Array),
        int64: new t(BigInt64Array),
        bigint64: new t(BigInt64Array),
        i64: new t(BigInt64Array),
        long: new t(BigInt64Array),
        uint64: new t(BigUint64Array),
        biguint64: new t(BigUint64Array),
        u64: new t(BigUint64Array),
        ulong: new t(BigUint64Array)
    },
    e = new Map;
for (let t in n) {
    const r = t;
    e.set(n[r].arr, r)
}

function r(t) {
    const n = [e.get(Object.getPrototypeOf(t).constructor), [],
        []
    ];
    let r = 0;
    for (let e = 0; e < t.length; e++) {
        if (0 !== t[e]) {
            n[1].push(r);
            const i = t[e];
            n[2].push("bigint" == typeof i ? i.toString() : i), r = 0
        }
        r++
    }
    return n
}

function i(t, e) {
    const r = new n[t[0]].arr(e);
    let i = 0;
    for (let n = 0; n < t[1].length; n += 1) {
        i += t[1][n];
        const e = t[2][n];
        r[i] = "string" == typeof e ? BigInt(e) : e
    }
    return r
}
class s {
    mask;
    archetypes = [];
    constructor(t) {
        const n = (t, n) => {
            t.forEach((t => {
                n[Math.floor(t / 32)] |= 1 << t % 32
            }))
        };
        this.mask = [], (t = t ?? []).map(((t, e) => {
            const r = n => new Uint32Array(Math.ceil((Math.max(0, ...t[n]) + 1) / 32));
            this.mask.push([r(0), r(1)]), n(t[0], this.mask[e][0]), n(t[1], this.mask[e][1])
        }))
    }
    static match(t, n) {
        if (n.length) {
            if (!s.matchAll(t, n[0])) return !1;
            for (let e of n.slice(1))
                if (!s.matchAny(t, e)) return !1
        }
        return !0
    }
    static matchAll(t, n) {
        for (let e = 0; e < n[0].length; e++)
            if ((t[e] & n[0][e]) < n[0][e]) return !1;
        for (let e = 0; e < n[1].length; e++)
            if ((t[e] & n[1][e]) > 0) return !1;
        return !0
    }
    static matchAny(t, n) {
        for (let e = 0; e < n[0].length; e++)
            if ((t[e] & n[0][e]) > 0) return !0;
        for (let e = 0; e < n[1].length; e++)
            if ((t[e] & n[1][e]) < n[1][e]) return !0;
        return !1
    }
}

function h(t, n, e) {
    return n[t[e]] === e
}

function o(t, n, e) {
    h(t, n, e) || (t[e] = n.length, n.push(e))
}

function a(t, n, e) {
    if (h(t, n, e)) {
        const r = n.pop();
        e !== r && (t[r] = t[e], n[t[e]] = r)
    }
}
class c {
    mask;
    entities = [];
    keys = [];
    change = [];
    constructor(t) {
        this.mask = t
    }
    has(t) {
        return h(this.keys, this.entities, t)
    }
}

function m(t, n) {
    return function e(r) {
        if (n(r)) return t(r);
        const i = {};
        for (let t in r) i[t] = e(r[t]);
        return i
    }
}
class _ {
    _arch = new Map;
    _dex = {};
    _ent = [];
    _queries = [];
    _destroy = [];
    _destroykeys = [];
    _mcmp = {
        addrm: [],
        ent: [],
        cmp: []
    };
    _rm = [];
    _rmkeys = [];
    _empty = new c(new Uint32Array);
    cmpID = 0;
    entID = 0;
    components = {};
    MAX_ENTITIES = 1e4;
    constructor(t) {
        if ("number" == typeof t) this.MAX_ENTITIES = t;
        else if (void 0 !== t) {
            "string" == typeof t && (t = JSON.parse(t));
            for (let n in t)["_ent", "components"].includes(n) || (this[n] = t[n]);
            this.entID && this._initEmpty();
            for (let n of t._rm) this._rmkeys[n] = !0;
            for (let n = 0; n < t._ent.length; n++) 0 !== t._ent[n] && (this._ent[n] = this._getArch(new Uint32Array(t._ent[n])), o(this._ent[n].keys, this._ent[n].entities, n));
            for (let n in t.components) this.components[n] = m((t => i(t, this.MAX_ENTITIES)), (t => t instanceof Array))(t.components[n])
        }
    }
    serialise() {
        const t = {};
        for (let n in this)["_arch", "_ent", "_queries", "_rmkeys", "_empty", "components"].includes(n) || (t[n] = this[n]);
        t._ent = this._ent.map(((t, n) => t.has(n) ? Array.from(t.mask) : 0)), t.components = {};
        for (let n in this.components) t.components[n] = m(r, (t => "number" == typeof t.length))(this.components[n]);
        return t
    }
    defineComponent(n, e = {}) {
        if (this.entID) throw new Error("cannot define component after entity creation");
        if (n in this.components) throw new Error("duplicate component names");
        if (/^[\w-]+$/.test(n)) return this.components[n] = m((t => new t.arr(this.MAX_ENTITIES)), (n => n instanceof t))(e), this._dex[n] = this.cmpID++, this;
        throw new Error("invalid component name")
    }
    _initEmpty() {
        this._empty.mask = new Uint32Array(Math.ceil(this.cmpID / 32)), this._arch.set(this._empty.mask.toString(), this._empty)
    }
    _validateComponent(t) {
        if (void 0 === t) throw new Error("invalid component name")
    }
    createQuery(...t) {
        const n = t.filter((t => t.includes(" "))).map((t => t.split(" ")));
        t = t.filter((t => !t.includes(" ")));
        const e = new s([t, ...n].map((t => {
            const n = [t.filter((t => "!" !== t[0])).map((t => this._dex[t])), t.filter((t => "!" === t[0])).map((t => this._dex[t.slice(1)]))];
            return n.forEach((t => t.forEach((t => this._validateComponent(t))))), n
        })));
        return this._arch.forEach((t => {
            s.match(t.mask, e.mask) && e.archetypes.push(t)
        })), this._queries.push(e), e
    }
    _validID(t) {
        return !(this._rmkeys[t] || this.entID <= t)
    }
    _validateID(t) {
        if (!this._validID(t)) throw new Error("invalid entity id")
    }
    _getArch(t) {
        if (!this._arch.has(t.toString())) {
            const n = new c(t.slice());
            this._arch.set(t.toString(), n);
            for (let e of this._queries) s.match(t, e.mask) && e.archetypes.push(n)
        }
        return this._arch.get(t.toString())
    }
    _hasComponent(t, n) {
        return t[Math.floor(n / 32)] & 1 << n % 32
    }
    _archChange(t, n) {
        this._validateID(t);
        const e = this._ent[t];
        a(e.keys, e.entities, t), e.change[n] || (this._hasComponent(e.mask, n) ? (e.mask[Math.floor(n / 32)] &= ~(1 << n % 32), e.change[n] = this._getArch(e.mask), e.mask[Math.floor(n / 32)] |= 1 << n % 32) : (e.mask[Math.floor(n / 32)] |= 1 << n % 32, e.change[n] = this._getArch(e.mask), e.mask[Math.floor(n / 32)] &= ~(1 << n % 32))), this._ent[t] = e.change[n], o(this._ent[t].keys, this._ent[t].entities, t)
    }
    _crEnt(t) {
        this._ent[t] = this._empty, o(this._empty.keys, this._empty.entities, t)
    }
    createEntity() {
        if (this._rm.length) {
            const t = this._rm.pop();
            return this._rmkeys[t] = !1, this._crEnt(t), t
        }
        if (this.entID || this._initEmpty(), this.entID === this.MAX_ENTITIES) throw new Error("maximum entity limit reached");
        return this._crEnt(this.entID), this.entID++
    }
    destroyEntity(t, n = !1) {
        n ? o(this._destroykeys, this._destroy, t) : (a(this._ent[t].keys, this._ent[t].entities, t), a(this._destroykeys, this._destroy, t), this._rm.push(t), this._rmkeys[t] = !0)
    }
    destroyPending() {
        for (; this._destroy.length > 0;) this.destroyEntity(this._destroy[0]);
        this._destroykeys = []
    }
    _addcmp(t, n) {
        this._hasComponent(this._ent[t].mask, n) || this._archChange(t, n)
    }
    addComponent(t, n, e = !1) {
        this._validateID(t);
        const r = this._dex[n];
        return this._validateComponent(r), e ? (this._mcmp.addrm.push(!0), this._mcmp.ent.push(t), this._mcmp.cmp.push(r)) : this._addcmp(t, r), this
    }
    _rmcmp(t, n) {
        this._hasComponent(this._ent[t].mask, n) && this._archChange(t, n)
    }
    removeComponent(t, n, e = !1) {
        this._validateID(t);
        const r = this._dex[n];
        return this._validateComponent(r), e ? (this._mcmp.addrm.push(!1), this._mcmp.ent.push(t), this._mcmp.cmp.push(r)) : this._rmcmp(t, r), this
    }
    updatePending() {
        for (let t = this._mcmp.addrm.length - 1; t >= 0; t--) this._validID(this._mcmp.ent[t]) && (this._mcmp.addrm[t] ? this._addcmp(this._mcmp.ent[t], this._mcmp.cmp[t]) : this._rmcmp(this._mcmp.ent[t], this._mcmp.cmp[t]));
        this._mcmp = {
            addrm: [],
            ent: [],
            cmp: []
        }
    }
}

function p(t, n, e, r) {
    return function() {
        e?.();
        for (let e = 0, r = t.archetypes.length; e < r; e++) {
            const r = t.archetypes[e].entities;
            for (let t = r.length; t > 0; t--) n(r[t - 1])
        }
        r?.()
    }
}
export {
    _ as ECS, p as defineSystem, n as types
};