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

var ConnectionCosts = require("../ConnectionCosts");

/**
 * Builder class for constructing ConnectionCosts object
 * @constructor
 */
function ConnectionCostsBuilder() {
    this.lines = 0;
    this.connection_cost = null;
}

ConnectionCostsBuilder.prototype.putLine = function (line) {
    if (this.lines === 0) {
        var dimensions = line.split(" ");
        var forward_dimension = dimensions[0];
        var backward_dimension = dimensions[1];

        if (forward_dimension < 0 || backward_dimension < 0) {
            throw "Parse error of matrix.def";
        }

        this.connection_cost = new ConnectionCosts(forward_dimension, backward_dimension);
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

    if (forward_id < 0 || backward_id < 0 || !isFinite(forward_id) || !isFinite(backward_id) ||
        this.connection_cost.forward_dimension <= forward_id || this.connection_cost.backward_dimension <= backward_id) {
        throw "Parse error of matrix.def";
    }

    this.connection_cost.put(forward_id, backward_id, cost);
    this.lines++;
    return this;
};

ConnectionCostsBuilder.prototype.build = function () {
    return this.connection_cost;
};

module.exports = ConnectionCostsBuilder;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJkaWN0L2J1aWxkZXIvQ29ubmVjdGlvbkNvc3RzQnVpbGRlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTQgVGFrdXlhIEFzYW5vXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IEF0aWxpa2EgSW5jLiBhbmQgY29udHJpYnV0b3JzXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgQ29ubmVjdGlvbkNvc3RzID0gcmVxdWlyZShcIi4uL0Nvbm5lY3Rpb25Db3N0c1wiKTtcblxuLyoqXG4gKiBCdWlsZGVyIGNsYXNzIGZvciBjb25zdHJ1Y3RpbmcgQ29ubmVjdGlvbkNvc3RzIG9iamVjdFxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIENvbm5lY3Rpb25Db3N0c0J1aWxkZXIoKSB7XG4gICAgdGhpcy5saW5lcyA9IDA7XG4gICAgdGhpcy5jb25uZWN0aW9uX2Nvc3QgPSBudWxsO1xufVxuXG5Db25uZWN0aW9uQ29zdHNCdWlsZGVyLnByb3RvdHlwZS5wdXRMaW5lID0gZnVuY3Rpb24gKGxpbmUpIHtcbiAgICBpZiAodGhpcy5saW5lcyA9PT0gMCkge1xuICAgICAgICB2YXIgZGltZW5zaW9ucyA9IGxpbmUuc3BsaXQoXCIgXCIpO1xuICAgICAgICB2YXIgZm9yd2FyZF9kaW1lbnNpb24gPSBkaW1lbnNpb25zWzBdO1xuICAgICAgICB2YXIgYmFja3dhcmRfZGltZW5zaW9uID0gZGltZW5zaW9uc1sxXTtcblxuICAgICAgICBpZiAoZm9yd2FyZF9kaW1lbnNpb24gPCAwIHx8IGJhY2t3YXJkX2RpbWVuc2lvbiA8IDApIHtcbiAgICAgICAgICAgIHRocm93IFwiUGFyc2UgZXJyb3Igb2YgbWF0cml4LmRlZlwiO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jb25uZWN0aW9uX2Nvc3QgPSBuZXcgQ29ubmVjdGlvbkNvc3RzKGZvcndhcmRfZGltZW5zaW9uLCBiYWNrd2FyZF9kaW1lbnNpb24pO1xuICAgICAgICB0aGlzLmxpbmVzKys7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHZhciBjb3N0cyA9IGxpbmUuc3BsaXQoXCIgXCIpO1xuXG4gICAgaWYgKGNvc3RzLmxlbmd0aCAhPT0gMykge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICB2YXIgZm9yd2FyZF9pZCA9IHBhcnNlSW50KGNvc3RzWzBdKTtcbiAgICB2YXIgYmFja3dhcmRfaWQgPSBwYXJzZUludChjb3N0c1sxXSk7XG4gICAgdmFyIGNvc3QgPSBwYXJzZUludChjb3N0c1syXSk7XG5cbiAgICBpZiAoZm9yd2FyZF9pZCA8IDAgfHwgYmFja3dhcmRfaWQgPCAwIHx8ICFpc0Zpbml0ZShmb3J3YXJkX2lkKSB8fCAhaXNGaW5pdGUoYmFja3dhcmRfaWQpIHx8XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbl9jb3N0LmZvcndhcmRfZGltZW5zaW9uIDw9IGZvcndhcmRfaWQgfHwgdGhpcy5jb25uZWN0aW9uX2Nvc3QuYmFja3dhcmRfZGltZW5zaW9uIDw9IGJhY2t3YXJkX2lkKSB7XG4gICAgICAgIHRocm93IFwiUGFyc2UgZXJyb3Igb2YgbWF0cml4LmRlZlwiO1xuICAgIH1cblxuICAgIHRoaXMuY29ubmVjdGlvbl9jb3N0LnB1dChmb3J3YXJkX2lkLCBiYWNrd2FyZF9pZCwgY29zdCk7XG4gICAgdGhpcy5saW5lcysrO1xuICAgIHJldHVybiB0aGlzO1xufTtcblxuQ29ubmVjdGlvbkNvc3RzQnVpbGRlci5wcm90b3R5cGUuYnVpbGQgPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbl9jb3N0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBDb25uZWN0aW9uQ29zdHNCdWlsZGVyO1xuIl0sImZpbGUiOiJkaWN0L2J1aWxkZXIvQ29ubmVjdGlvbkNvc3RzQnVpbGRlci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
