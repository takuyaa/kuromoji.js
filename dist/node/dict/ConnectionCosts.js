/*
 * Copyright Copyright 2014 Takuya Asano
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGljdC9Db25uZWN0aW9uQ29zdHMuanMiLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJkaWN0L0Nvbm5lY3Rpb25Db3N0cy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBDb25uZWN0aW9uIGNvc3RzIG1hdHJpeCBmcm9tIGNjLmRhdCBmaWxlLlxuICogMiBkaW1lbnNpb24gbWF0cml4IFtmb3J3YXJkX2lkXVtiYWNrd2FyZF9pZF0gLT4gY29zdFxuICogQHBhcmFtIHtudW1iZXJ9IGluaXRpYWxfc2l6ZSBJbml0aWFsIHNpemUgb2YgYnVmZmVyXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQ29ubmVjdGlvbkNvc3RzKGluaXRpYWxfc2l6ZSkge1xuICAgIHRoaXMuZGltZW5zaW9uID0gMDtcbiAgICB0aGlzLmJ1ZmZlciA9IG5ldyBJbnQxNkFycmF5KGluaXRpYWxfc2l6ZSk7XG5cbiAgICAvLyAxIGRpbWVuc2lvbmFsIGFycmF5IGluIG9yaWdpbmFsIGltcGxlbWVudGF0aW9uXG4gICAgLy8gdGhpcy5jb3N0cyA9IFtdO1xufVxuXG5Db25uZWN0aW9uQ29zdHMucHJvdG90eXBlLnB1dCA9IGZ1bmN0aW9uIChmb3J3YXJkX2lkLCBiYWNrd2FyZF9pZCwgY29zdCkge1xuICAgIGlmICghaXNGaW5pdGUoZm9yd2FyZF9pZCkpIHtcbiAgICAgICAgY29uc29sZS5sb2coZm9yd2FyZF9pZCArIFwiIFwiICsgYmFja3dhcmRfaWQgKyBcIiBcIiArIGNvc3QpO1xuICAgIH1cbiAgICB2YXIgaW5kZXggPSBmb3J3YXJkX2lkICogdGhpcy5kaW1lbnNpb24gKyBiYWNrd2FyZF9pZDtcbiAgICBpZiAodGhpcy5idWZmZXIubGVuZ3RoIDwgaW5kZXggKyAxKSB7XG4gICAgICAgIHRocm93IFwiQ29ubmVjdGlvbkNvc3RzIGJ1ZmZlciBvdmVyZmxvd1wiO1xuICAgIH1cbiAgICB0aGlzLmJ1ZmZlcltpbmRleF0gPSBjb3N0O1xuXG4gICAgLy8gaWYgKHRoaXMuY29zdHNbZm9yd2FyZF9pZF0gPT0gbnVsbCkge1xuICAgIC8vICAgICB0aGlzLmNvc3RzW2ZvcndhcmRfaWRdID0gW107XG4gICAgLy8gfVxuICAgIC8vIHRoaXMuY29zdHNbZm9yd2FyZF9pZF1bYmFja3dhcmRfaWRdID0gY29zdDtcbn07XG5cbkNvbm5lY3Rpb25Db3N0cy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGZvcndhcmRfaWQsIGJhY2t3YXJkX2lkKSB7XG4gICAgdmFyIGluZGV4ID0gZm9yd2FyZF9pZCAqIHRoaXMuZGltZW5zaW9uICsgYmFja3dhcmRfaWQ7XG4gICAgaWYgKHRoaXMuYnVmZmVyLmxlbmd0aCA8IGluZGV4ICsgMSkge1xuICAgICAgICB0aHJvdyBcIkNvbm5lY3Rpb25Db3N0cyBidWZmZXIgb3ZlcmZsb3dcIjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYnVmZmVyW2luZGV4XTtcblxuICAgIC8vIGlmICh0aGlzLmNvc3RzW2ZvcndhcmRfaWRdID09IG51bGwpIHtcbiAgICAvLyAgICAgcmV0dXJuIG51bGw7XG4gICAgLy8gfVxuICAgIC8vIHJldHVybiB0aGlzLmNvc3RzW2ZvcndhcmRfaWRdW2JhY2t3YXJkX2lkXTtcbn07XG5cbkNvbm5lY3Rpb25Db3N0cy5wcm90b3R5cGUubG9hZENvbm5lY3Rpb25Db3N0cyA9IGZ1bmN0aW9uIChjb25uZWN0aW9uX2Nvc3RzX2J1ZmZlcikge1xuICAgIC8vIFRPRE8gUmVhZCBkaW1lbnNpb24gZnJvbSBjb25uZWN0aW9uX2Nvc3RzX2J1ZmZlclxuICAgIHRoaXMuZGltZW5zaW9uID0gMTMxNjtcbiAgICB0aGlzLmJ1ZmZlciA9IGNvbm5lY3Rpb25fY29zdHNfYnVmZmVyO1xufTtcblxuLyoqXG4gKiBQYXJzZSBhbmQgYnVpbGQgQ29ubmVjdGlvbkNvc3RzIGZyb20gY29udGVudHMgb2YgXCJtYXRyaXguZGVmXCJcbiAqIEBwYXJhbSB7c3RyaW5nfSBtYXRyaXhfdGV4dCBUZXh0IGNvbnRlbnRzIG9mIFwibWF0cml4LmRlZlwiXG4gKiBAcmV0dXJucyB7Q29ubmVjdGlvbkNvc3RzfVxuICovXG5Db25uZWN0aW9uQ29zdHMuYnVpbGQgPSBmdW5jdGlvbiAobWF0cml4X3RleHQpIHtcbiAgICB2YXIgcm93cyA9IG1hdHJpeF90ZXh0LnNwbGl0KC9cXG4vKS5tYXAoZnVuY3Rpb24gKHJvdykge1xuICAgICAgICByZXR1cm4gcm93LnNwbGl0KFwiIFwiKTtcbiAgICB9KTtcblxuICAgIC8vIFJvdyAxXG4gICAgLy8gdmFyIGZvcndhcmRfc2l6ZSA9IHJvd3NbMF1bMF07XG4gICAgdmFyIGJhY2t3YXJkX3NpemUgPSByb3dzWzBdWzFdO1xuXG4gICAgLy8gaWQgYW5kIGNvc3QgbXVzdCBiZSBhIHNob3J0IHZhbHVlXG4gICAgdmFyIGNvc3RzID0gbmV3IENvbm5lY3Rpb25Db3N0cyhiYWNrd2FyZF9zaXplICogYmFja3dhcmRfc2l6ZSk7XG4gICAgY29zdHMuZGltZW5zaW9uID0gYmFja3dhcmRfc2l6ZTtcblxuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgcm93cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAocm93c1tpXS5sZW5ndGggPCAzKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBmb3J3YXJkX2lkID0gcGFyc2VJbnQocm93c1tpXVswXSk7XG4gICAgICAgIHZhciBiYWNrd2FyZF9pZCA9IHBhcnNlSW50KHJvd3NbaV1bMV0pO1xuICAgICAgICB2YXIgY29zdCA9IHBhcnNlSW50KHJvd3NbaV1bMl0pO1xuXG4gICAgICAgIC8vIEFzc2VydGlvblxuICAgICAgICBpZiAoZm9yd2FyZF9pZCA8IDAgfHwgYmFja3dhcmRfaWQgPCAwKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkVycm9yIGluOlwiICsgcm93c1tpXSk7XG4gICAgICAgIH1cblxuICAgICAgICBjb3N0cy5wdXQoZm9yd2FyZF9pZCwgYmFja3dhcmRfaWQsIGNvc3QpO1xuICAgIH1cblxuICAgIHJldHVybiBjb3N0cztcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBDb25uZWN0aW9uQ29zdHM7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=