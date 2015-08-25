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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJkaWN0L0Nvbm5lY3Rpb25Db3N0cy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTQgVGFrdXlhIEFzYW5vXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IEF0aWxpa2EgSW5jLiBhbmQgY29udHJpYnV0b3JzXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIENvbm5lY3Rpb24gY29zdHMgbWF0cml4IGZyb20gY2MuZGF0IGZpbGUuXG4gKiAyIGRpbWVuc2lvbiBtYXRyaXggW2ZvcndhcmRfaWRdW2JhY2t3YXJkX2lkXSAtPiBjb3N0XG4gKiBAcGFyYW0ge251bWJlcn0gaW5pdGlhbF9zaXplIEluaXRpYWwgc2l6ZSBvZiBidWZmZXJcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBDb25uZWN0aW9uQ29zdHMoaW5pdGlhbF9zaXplKSB7XG4gICAgdGhpcy5kaW1lbnNpb24gPSAwO1xuICAgIHRoaXMuYnVmZmVyID0gbmV3IEludDE2QXJyYXkoaW5pdGlhbF9zaXplKTtcblxuICAgIC8vIDEgZGltZW5zaW9uYWwgYXJyYXkgaW4gb3JpZ2luYWwgaW1wbGVtZW50YXRpb25cbiAgICAvLyB0aGlzLmNvc3RzID0gW107XG59XG5cbkNvbm5lY3Rpb25Db3N0cy5wcm90b3R5cGUucHV0ID0gZnVuY3Rpb24gKGZvcndhcmRfaWQsIGJhY2t3YXJkX2lkLCBjb3N0KSB7XG4gICAgaWYgKCFpc0Zpbml0ZShmb3J3YXJkX2lkKSkge1xuICAgICAgICBjb25zb2xlLmxvZyhmb3J3YXJkX2lkICsgXCIgXCIgKyBiYWNrd2FyZF9pZCArIFwiIFwiICsgY29zdCk7XG4gICAgfVxuICAgIHZhciBpbmRleCA9IGZvcndhcmRfaWQgKiB0aGlzLmRpbWVuc2lvbiArIGJhY2t3YXJkX2lkO1xuICAgIGlmICh0aGlzLmJ1ZmZlci5sZW5ndGggPCBpbmRleCArIDEpIHtcbiAgICAgICAgdGhyb3cgXCJDb25uZWN0aW9uQ29zdHMgYnVmZmVyIG92ZXJmbG93XCI7XG4gICAgfVxuICAgIHRoaXMuYnVmZmVyW2luZGV4XSA9IGNvc3Q7XG5cbiAgICAvLyBpZiAodGhpcy5jb3N0c1tmb3J3YXJkX2lkXSA9PSBudWxsKSB7XG4gICAgLy8gICAgIHRoaXMuY29zdHNbZm9yd2FyZF9pZF0gPSBbXTtcbiAgICAvLyB9XG4gICAgLy8gdGhpcy5jb3N0c1tmb3J3YXJkX2lkXVtiYWNrd2FyZF9pZF0gPSBjb3N0O1xufTtcblxuQ29ubmVjdGlvbkNvc3RzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoZm9yd2FyZF9pZCwgYmFja3dhcmRfaWQpIHtcbiAgICB2YXIgaW5kZXggPSBmb3J3YXJkX2lkICogdGhpcy5kaW1lbnNpb24gKyBiYWNrd2FyZF9pZDtcbiAgICBpZiAodGhpcy5idWZmZXIubGVuZ3RoIDwgaW5kZXggKyAxKSB7XG4gICAgICAgIHRocm93IFwiQ29ubmVjdGlvbkNvc3RzIGJ1ZmZlciBvdmVyZmxvd1wiO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5idWZmZXJbaW5kZXhdO1xuXG4gICAgLy8gaWYgKHRoaXMuY29zdHNbZm9yd2FyZF9pZF0gPT0gbnVsbCkge1xuICAgIC8vICAgICByZXR1cm4gbnVsbDtcbiAgICAvLyB9XG4gICAgLy8gcmV0dXJuIHRoaXMuY29zdHNbZm9yd2FyZF9pZF1bYmFja3dhcmRfaWRdO1xufTtcblxuQ29ubmVjdGlvbkNvc3RzLnByb3RvdHlwZS5sb2FkQ29ubmVjdGlvbkNvc3RzID0gZnVuY3Rpb24gKGNvbm5lY3Rpb25fY29zdHNfYnVmZmVyKSB7XG4gICAgLy8gVE9ETyBSZWFkIGRpbWVuc2lvbiBmcm9tIGNvbm5lY3Rpb25fY29zdHNfYnVmZmVyXG4gICAgdGhpcy5kaW1lbnNpb24gPSAxMzE2O1xuICAgIHRoaXMuYnVmZmVyID0gY29ubmVjdGlvbl9jb3N0c19idWZmZXI7XG59O1xuXG4vKipcbiAqIFBhcnNlIGFuZCBidWlsZCBDb25uZWN0aW9uQ29zdHMgZnJvbSBjb250ZW50cyBvZiBcIm1hdHJpeC5kZWZcIlxuICogQHBhcmFtIHtzdHJpbmd9IG1hdHJpeF90ZXh0IFRleHQgY29udGVudHMgb2YgXCJtYXRyaXguZGVmXCJcbiAqIEByZXR1cm5zIHtDb25uZWN0aW9uQ29zdHN9XG4gKi9cbkNvbm5lY3Rpb25Db3N0cy5idWlsZCA9IGZ1bmN0aW9uIChtYXRyaXhfdGV4dCkge1xuICAgIHZhciByb3dzID0gbWF0cml4X3RleHQuc3BsaXQoL1xcbi8pLm1hcChmdW5jdGlvbiAocm93KSB7XG4gICAgICAgIHJldHVybiByb3cuc3BsaXQoXCIgXCIpO1xuICAgIH0pO1xuXG4gICAgLy8gUm93IDFcbiAgICAvLyB2YXIgZm9yd2FyZF9zaXplID0gcm93c1swXVswXTtcbiAgICB2YXIgYmFja3dhcmRfc2l6ZSA9IHJvd3NbMF1bMV07XG5cbiAgICAvLyBpZCBhbmQgY29zdCBtdXN0IGJlIGEgc2hvcnQgdmFsdWVcbiAgICB2YXIgY29zdHMgPSBuZXcgQ29ubmVjdGlvbkNvc3RzKGJhY2t3YXJkX3NpemUgKiBiYWNrd2FyZF9zaXplKTtcbiAgICBjb3N0cy5kaW1lbnNpb24gPSBiYWNrd2FyZF9zaXplO1xuXG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCByb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChyb3dzW2ldLmxlbmd0aCA8IDMpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGZvcndhcmRfaWQgPSBwYXJzZUludChyb3dzW2ldWzBdKTtcbiAgICAgICAgdmFyIGJhY2t3YXJkX2lkID0gcGFyc2VJbnQocm93c1tpXVsxXSk7XG4gICAgICAgIHZhciBjb3N0ID0gcGFyc2VJbnQocm93c1tpXVsyXSk7XG5cbiAgICAgICAgLy8gQXNzZXJ0aW9uXG4gICAgICAgIGlmIChmb3J3YXJkX2lkIDwgMCB8fCBiYWNrd2FyZF9pZCA8IDApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRXJyb3IgaW46XCIgKyByb3dzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvc3RzLnB1dChmb3J3YXJkX2lkLCBiYWNrd2FyZF9pZCwgY29zdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvc3RzO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbm5lY3Rpb25Db3N0cztcbiJdLCJmaWxlIjoiZGljdC9Db25uZWN0aW9uQ29zdHMuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==