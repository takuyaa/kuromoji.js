/*
 * Copyright 2014 Takuya Asano
 * Copyright 2010-2014 Atilika Inc. and contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

/**
 * Connection costs matrix from cc.dat file.
 * 2 dimension matrix [forward_id][backward_id] -> cost
 * @constructor
 */
function ConnectionCosts() {
    this.lines = 0;
    this.forward_dimension = 0;
    this.backward_dimension = 0;
    this.buffer = null;
}

ConnectionCosts.prototype.putLine = function (line) {
    if (this.lines === 0) {
        var dimensions = line.split(' ');
        this.forward_dimension = dimensions[0];
        this.backward_dimension = dimensions[1];
        if (this.forward_dimension < 0 || this.backward_dimension < 0) {
            throw "Parse error of matrix.def";
        }
        this.buffer = new Int16Array(this.forward_dimension * this.backward_dimension);
        this.lines++;
        return this;
    }

    var costs = line.split(" ");

    if (costs.length !== 3) {
        return this;
    }

    var forward_id = parseInt(costs[0]);
    var backward_id = parseInt(costs[1]);
    var cost = parseInt(costs[2]);

    if (forward_id < 0 || backward_id < 0
        || !isFinite(forward_id) || !isFinite(backward_id)
        || this.forward_dimension <= forward_id || this.backward_dimension <= backward_id) {
        throw "Parse error of matrix.def";
    }

    this.put(forward_id, backward_id, cost);
    this.lines++;
    return this;
};

ConnectionCosts.prototype.put = function (forward_id, backward_id, cost) {
    var index = forward_id * this.backward_dimension + backward_id;
    if (this.buffer.length < index + 1) {
        throw "ConnectionCosts buffer overflow";
    }
    this.buffer[index] = cost;
};

ConnectionCosts.prototype.get = function (forward_id, backward_id) {
    var index = forward_id * this.backward_dimension + backward_id;
    if (this.buffer.length < index + 1) {
        throw "ConnectionCosts buffer overflow";
    }
    return this.buffer[index];
};

ConnectionCosts.prototype.loadConnectionCosts = function (connection_costs_buffer) {
    // TODO Read dimension from connection_costs_buffer
    this.forward_dimension = 1316;
    this.backward_dimension = 1316;
    this.buffer = connection_costs_buffer;
};

module.exports = ConnectionCosts;
