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

var ViterbiNode = require("./ViterbiNode.js");


/**
 * ViterbiLattice is a lattice in Viterbi algorithm
 * @constructor
 */
function ViterbiLattice() {
    this.nodes_end_at = [];
    this.nodes_end_at[0] = [ new ViterbiNode("BOS", 0, 0, 0, "BOS", 0, 0) ];
    this.eos_pos = 1;
}

/**
 * Append node to ViterbiLattice
 * @param {ViterbiNode} node
 */
ViterbiLattice.prototype.append = function (node) {
    var last_pos = node.start_pos + node.length - 1;
    if (this.eos_pos < last_pos) {
        this.eos_pos = last_pos;
    }

    var prev_nodes = this.nodes_end_at[last_pos];
    if (prev_nodes == null) {
        prev_nodes = [];
    }
    prev_nodes.push(node);

    this.nodes_end_at[last_pos] = prev_nodes;
};

/**
 * Set ends with EOS (End of Statement)
 */
ViterbiLattice.prototype.appendEos = function () {
    var last_index = this.nodes_end_at.length;
    this.eos_pos++;
    this.nodes_end_at[last_index] = [ new ViterbiNode("EOS", 0, this.eos_pos, 0, "EOS", 0, 0) ];
};


module.exports = ViterbiLattice;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aXRlcmJpL1ZpdGVyYmlMYXR0aWNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNCBUYWt1eWEgQXNhbm9cbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQXRpbGlrYSBJbmMuIGFuZCBjb250cmlidXRvcnNcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBWaXRlcmJpTm9kZSA9IHJlcXVpcmUoXCIuL1ZpdGVyYmlOb2RlLmpzXCIpO1xuXG5cbi8qKlxuICogVml0ZXJiaUxhdHRpY2UgaXMgYSBsYXR0aWNlIGluIFZpdGVyYmkgYWxnb3JpdGhtXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gVml0ZXJiaUxhdHRpY2UoKSB7XG4gICAgdGhpcy5ub2Rlc19lbmRfYXQgPSBbXTtcbiAgICB0aGlzLm5vZGVzX2VuZF9hdFswXSA9IFsgbmV3IFZpdGVyYmlOb2RlKFwiQk9TXCIsIDAsIDAsIDAsIFwiQk9TXCIsIDAsIDApIF07XG4gICAgdGhpcy5lb3NfcG9zID0gMTtcbn1cblxuLyoqXG4gKiBBcHBlbmQgbm9kZSB0byBWaXRlcmJpTGF0dGljZVxuICogQHBhcmFtIHtWaXRlcmJpTm9kZX0gbm9kZVxuICovXG5WaXRlcmJpTGF0dGljZS5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICB2YXIgbGFzdF9wb3MgPSBub2RlLnN0YXJ0X3BvcyArIG5vZGUubGVuZ3RoIC0gMTtcbiAgICBpZiAodGhpcy5lb3NfcG9zIDwgbGFzdF9wb3MpIHtcbiAgICAgICAgdGhpcy5lb3NfcG9zID0gbGFzdF9wb3M7XG4gICAgfVxuXG4gICAgdmFyIHByZXZfbm9kZXMgPSB0aGlzLm5vZGVzX2VuZF9hdFtsYXN0X3Bvc107XG4gICAgaWYgKHByZXZfbm9kZXMgPT0gbnVsbCkge1xuICAgICAgICBwcmV2X25vZGVzID0gW107XG4gICAgfVxuICAgIHByZXZfbm9kZXMucHVzaChub2RlKTtcblxuICAgIHRoaXMubm9kZXNfZW5kX2F0W2xhc3RfcG9zXSA9IHByZXZfbm9kZXM7XG59O1xuXG4vKipcbiAqIFNldCBlbmRzIHdpdGggRU9TIChFbmQgb2YgU3RhdGVtZW50KVxuICovXG5WaXRlcmJpTGF0dGljZS5wcm90b3R5cGUuYXBwZW5kRW9zID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBsYXN0X2luZGV4ID0gdGhpcy5ub2Rlc19lbmRfYXQubGVuZ3RoO1xuICAgIHRoaXMuZW9zX3BvcysrO1xuICAgIHRoaXMubm9kZXNfZW5kX2F0W2xhc3RfaW5kZXhdID0gWyBuZXcgVml0ZXJiaU5vZGUoXCJFT1NcIiwgMCwgdGhpcy5lb3NfcG9zLCAwLCBcIkVPU1wiLCAwLCAwKSBdO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpdGVyYmlMYXR0aWNlO1xuIl0sImZpbGUiOiJ2aXRlcmJpL1ZpdGVyYmlMYXR0aWNlLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=