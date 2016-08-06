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

var ViterbiNode = require("./ViterbiNode");

/**
 * ViterbiLattice is a lattice in Viterbi algorithm
 * @constructor
 */
function ViterbiLattice() {
    this.nodes_end_at = [];
    this.nodes_end_at[0] = [ new ViterbiNode(-1, 0, 0, 0, "BOS", 0, 0, "") ];
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
    this.nodes_end_at[last_index] = [ new ViterbiNode(-1, 0, this.eos_pos, 0, "EOS", 0, 0, "") ];
};

module.exports = ViterbiLattice;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aXRlcmJpL1ZpdGVyYmlMYXR0aWNlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNCBUYWt1eWEgQXNhbm9cbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQXRpbGlrYSBJbmMuIGFuZCBjb250cmlidXRvcnNcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBWaXRlcmJpTm9kZSA9IHJlcXVpcmUoXCIuL1ZpdGVyYmlOb2RlXCIpO1xuXG4vKipcbiAqIFZpdGVyYmlMYXR0aWNlIGlzIGEgbGF0dGljZSBpbiBWaXRlcmJpIGFsZ29yaXRobVxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFZpdGVyYmlMYXR0aWNlKCkge1xuICAgIHRoaXMubm9kZXNfZW5kX2F0ID0gW107XG4gICAgdGhpcy5ub2Rlc19lbmRfYXRbMF0gPSBbIG5ldyBWaXRlcmJpTm9kZSgtMSwgMCwgMCwgMCwgXCJCT1NcIiwgMCwgMCwgXCJcIikgXTtcbiAgICB0aGlzLmVvc19wb3MgPSAxO1xufVxuXG4vKipcbiAqIEFwcGVuZCBub2RlIHRvIFZpdGVyYmlMYXR0aWNlXG4gKiBAcGFyYW0ge1ZpdGVyYmlOb2RlfSBub2RlXG4gKi9cblZpdGVyYmlMYXR0aWNlLnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIHZhciBsYXN0X3BvcyA9IG5vZGUuc3RhcnRfcG9zICsgbm9kZS5sZW5ndGggLSAxO1xuICAgIGlmICh0aGlzLmVvc19wb3MgPCBsYXN0X3Bvcykge1xuICAgICAgICB0aGlzLmVvc19wb3MgPSBsYXN0X3BvcztcbiAgICB9XG5cbiAgICB2YXIgcHJldl9ub2RlcyA9IHRoaXMubm9kZXNfZW5kX2F0W2xhc3RfcG9zXTtcbiAgICBpZiAocHJldl9ub2RlcyA9PSBudWxsKSB7XG4gICAgICAgIHByZXZfbm9kZXMgPSBbXTtcbiAgICB9XG4gICAgcHJldl9ub2Rlcy5wdXNoKG5vZGUpO1xuXG4gICAgdGhpcy5ub2Rlc19lbmRfYXRbbGFzdF9wb3NdID0gcHJldl9ub2Rlcztcbn07XG5cbi8qKlxuICogU2V0IGVuZHMgd2l0aCBFT1MgKEVuZCBvZiBTdGF0ZW1lbnQpXG4gKi9cblZpdGVyYmlMYXR0aWNlLnByb3RvdHlwZS5hcHBlbmRFb3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxhc3RfaW5kZXggPSB0aGlzLm5vZGVzX2VuZF9hdC5sZW5ndGg7XG4gICAgdGhpcy5lb3NfcG9zKys7XG4gICAgdGhpcy5ub2Rlc19lbmRfYXRbbGFzdF9pbmRleF0gPSBbIG5ldyBWaXRlcmJpTm9kZSgtMSwgMCwgdGhpcy5lb3NfcG9zLCAwLCBcIkVPU1wiLCAwLCAwLCBcIlwiKSBdO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWaXRlcmJpTGF0dGljZTtcbiJdLCJmaWxlIjoidml0ZXJiaS9WaXRlcmJpTGF0dGljZS5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
