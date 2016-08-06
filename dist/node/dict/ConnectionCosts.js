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
 * @param {number} forward_dimension
 * @param {number} backward_dimension
 */
function ConnectionCosts(forward_dimension, backward_dimension) {
    this.forward_dimension = forward_dimension;
    this.backward_dimension = backward_dimension;

    // leading 2 integers for forward_dimension, backward_dimension, respectively
    this.buffer = new Int16Array(forward_dimension * backward_dimension + 2);
    this.buffer[0] = forward_dimension;
    this.buffer[1] = backward_dimension;
}

ConnectionCosts.prototype.put = function (forward_id, backward_id, cost) {
    var index = forward_id * this.backward_dimension + backward_id + 2;
    if (this.buffer.length < index + 1) {
        throw "ConnectionCosts buffer overflow";
    }
    this.buffer[index] = cost;
};

ConnectionCosts.prototype.get = function (forward_id, backward_id) {
    var index = forward_id * this.backward_dimension + backward_id + 2;
    if (this.buffer.length < index + 1) {
        throw "ConnectionCosts buffer overflow";
    }
    return this.buffer[index];
};

ConnectionCosts.prototype.loadConnectionCosts = function (connection_costs_buffer) {
    this.forward_dimension = connection_costs_buffer[0];
    this.backward_dimension = connection_costs_buffer[1];
    this.buffer = connection_costs_buffer;
};

module.exports = ConnectionCosts;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJkaWN0L0Nvbm5lY3Rpb25Db3N0cy5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTQgVGFrdXlhIEFzYW5vXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IEF0aWxpa2EgSW5jLiBhbmQgY29udHJpYnV0b3JzXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIENvbm5lY3Rpb24gY29zdHMgbWF0cml4IGZyb20gY2MuZGF0IGZpbGUuXG4gKiAyIGRpbWVuc2lvbiBtYXRyaXggW2ZvcndhcmRfaWRdW2JhY2t3YXJkX2lkXSAtPiBjb3N0XG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7bnVtYmVyfSBmb3J3YXJkX2RpbWVuc2lvblxuICogQHBhcmFtIHtudW1iZXJ9IGJhY2t3YXJkX2RpbWVuc2lvblxuICovXG5mdW5jdGlvbiBDb25uZWN0aW9uQ29zdHMoZm9yd2FyZF9kaW1lbnNpb24sIGJhY2t3YXJkX2RpbWVuc2lvbikge1xuICAgIHRoaXMuZm9yd2FyZF9kaW1lbnNpb24gPSBmb3J3YXJkX2RpbWVuc2lvbjtcbiAgICB0aGlzLmJhY2t3YXJkX2RpbWVuc2lvbiA9IGJhY2t3YXJkX2RpbWVuc2lvbjtcblxuICAgIC8vIGxlYWRpbmcgMiBpbnRlZ2VycyBmb3IgZm9yd2FyZF9kaW1lbnNpb24sIGJhY2t3YXJkX2RpbWVuc2lvbiwgcmVzcGVjdGl2ZWx5XG4gICAgdGhpcy5idWZmZXIgPSBuZXcgSW50MTZBcnJheShmb3J3YXJkX2RpbWVuc2lvbiAqIGJhY2t3YXJkX2RpbWVuc2lvbiArIDIpO1xuICAgIHRoaXMuYnVmZmVyWzBdID0gZm9yd2FyZF9kaW1lbnNpb247XG4gICAgdGhpcy5idWZmZXJbMV0gPSBiYWNrd2FyZF9kaW1lbnNpb247XG59XG5cbkNvbm5lY3Rpb25Db3N0cy5wcm90b3R5cGUucHV0ID0gZnVuY3Rpb24gKGZvcndhcmRfaWQsIGJhY2t3YXJkX2lkLCBjb3N0KSB7XG4gICAgdmFyIGluZGV4ID0gZm9yd2FyZF9pZCAqIHRoaXMuYmFja3dhcmRfZGltZW5zaW9uICsgYmFja3dhcmRfaWQgKyAyO1xuICAgIGlmICh0aGlzLmJ1ZmZlci5sZW5ndGggPCBpbmRleCArIDEpIHtcbiAgICAgICAgdGhyb3cgXCJDb25uZWN0aW9uQ29zdHMgYnVmZmVyIG92ZXJmbG93XCI7XG4gICAgfVxuICAgIHRoaXMuYnVmZmVyW2luZGV4XSA9IGNvc3Q7XG59O1xuXG5Db25uZWN0aW9uQ29zdHMucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChmb3J3YXJkX2lkLCBiYWNrd2FyZF9pZCkge1xuICAgIHZhciBpbmRleCA9IGZvcndhcmRfaWQgKiB0aGlzLmJhY2t3YXJkX2RpbWVuc2lvbiArIGJhY2t3YXJkX2lkICsgMjtcbiAgICBpZiAodGhpcy5idWZmZXIubGVuZ3RoIDwgaW5kZXggKyAxKSB7XG4gICAgICAgIHRocm93IFwiQ29ubmVjdGlvbkNvc3RzIGJ1ZmZlciBvdmVyZmxvd1wiO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5idWZmZXJbaW5kZXhdO1xufTtcblxuQ29ubmVjdGlvbkNvc3RzLnByb3RvdHlwZS5sb2FkQ29ubmVjdGlvbkNvc3RzID0gZnVuY3Rpb24gKGNvbm5lY3Rpb25fY29zdHNfYnVmZmVyKSB7XG4gICAgdGhpcy5mb3J3YXJkX2RpbWVuc2lvbiA9IGNvbm5lY3Rpb25fY29zdHNfYnVmZmVyWzBdO1xuICAgIHRoaXMuYmFja3dhcmRfZGltZW5zaW9uID0gY29ubmVjdGlvbl9jb3N0c19idWZmZXJbMV07XG4gICAgdGhpcy5idWZmZXIgPSBjb25uZWN0aW9uX2Nvc3RzX2J1ZmZlcjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQ29ubmVjdGlvbkNvc3RzO1xuIl0sImZpbGUiOiJkaWN0L0Nvbm5lY3Rpb25Db3N0cy5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
