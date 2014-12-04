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
 * @param {number} initial_size Initial size of buffer
 * @constructor
 */
function ConnectionCosts(initial_size) {
    this.dimension = 0;
    this.buffer = new Int16Array(initial_size);

    // 1 dimensional array in original implementation
    // this.costs = [];
}

ConnectionCosts.prototype.put = function (forward_id, backward_id, cost) {
    if (!isFinite(forward_id)) {
        console.log(forward_id + " " + backward_id + " " + cost);
    }
    var index = forward_id * this.dimension + backward_id;
    if (this.buffer.length < index + 1) {
        throw "ConnectionCosts buffer overflow";
    }
    this.buffer[index] = cost;

    // if (this.costs[forward_id] == null) {
    //     this.costs[forward_id] = [];
    // }
    // this.costs[forward_id][backward_id] = cost;
};

ConnectionCosts.prototype.get = function (forward_id, backward_id) {
    var index = forward_id * this.dimension + backward_id;
    if (this.buffer.length < index + 1) {
        throw "ConnectionCosts buffer overflow";
    }
    return this.buffer[index];

    // if (this.costs[forward_id] == null) {
    //     return null;
    // }
    // return this.costs[forward_id][backward_id];
};

ConnectionCosts.prototype.loadConnectionCosts = function (connection_costs_buffer) {
    // TODO Read dimension from connection_costs_buffer
    this.dimension = 1316;
    this.buffer = connection_costs_buffer;
};

/**
 * Parse and build ConnectionCosts from contents of "matrix.def"
 * @param {string} matrix_text Text contents of "matrix.def"
 * @returns {ConnectionCosts}
 */
ConnectionCosts.build = function (matrix_text) {
    var rows = matrix_text.split(/\n/).map(function (row) {
        return row.split(" ");
    });

    // Row 1
    // var forward_size = rows[0][0];
    var backward_size = rows[0][1];

    // id and cost must be a short value
    var costs = new ConnectionCosts(backward_size * backward_size);
    costs.dimension = backward_size;

    for (var i = 1; i < rows.length; i++) {
        if (rows[i].length < 3) {
            continue;
        }

        var forward_id = parseInt(rows[i][0]);
        var backward_id = parseInt(rows[i][1]);
        var cost = parseInt(rows[i][2]);

        // Assertion
        if (forward_id < 0 || backward_id < 0) {
            console.log("Error in:" + rows[i]);
        }

        costs.put(forward_id, backward_id, cost);
    }

    return costs;
};


module.exports = ConnectionCosts;
