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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidml0ZXJiaS9WaXRlcmJpTGF0dGljZS5qcyIsIm5hbWVzIjpbXSwibWFwcGluZ3MiOiIiLCJzb3VyY2VzIjpbInZpdGVyYmkvVml0ZXJiaUxhdHRpY2UuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIFZpdGVyYmlOb2RlID0gcmVxdWlyZShcIi4vVml0ZXJiaU5vZGUuanNcIik7XG5cblxuLyoqXG4gKiBWaXRlcmJpTGF0dGljZSBpcyBhIGxhdHRpY2UgaW4gVml0ZXJiaSBhbGdvcml0aG1cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBWaXRlcmJpTGF0dGljZSgpIHtcbiAgICB0aGlzLm5vZGVzX2VuZF9hdCA9IFtdO1xuICAgIHRoaXMubm9kZXNfZW5kX2F0WzBdID0gWyBuZXcgVml0ZXJiaU5vZGUoXCJCT1NcIiwgMCwgMCwgMCwgXCJCT1NcIiwgMCwgMCkgXTtcbiAgICB0aGlzLmVvc19wb3MgPSAxO1xufVxuXG4vKipcbiAqIEFwcGVuZCBub2RlIHRvIFZpdGVyYmlMYXR0aWNlXG4gKiBAcGFyYW0ge1ZpdGVyYmlOb2RlfSBub2RlXG4gKi9cblZpdGVyYmlMYXR0aWNlLnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbiAobm9kZSkge1xuICAgIHZhciBsYXN0X3BvcyA9IG5vZGUuc3RhcnRfcG9zICsgbm9kZS5sZW5ndGggLSAxO1xuICAgIGlmICh0aGlzLmVvc19wb3MgPCBsYXN0X3Bvcykge1xuICAgICAgICB0aGlzLmVvc19wb3MgPSBsYXN0X3BvcztcbiAgICB9XG5cbiAgICB2YXIgcHJldl9ub2RlcyA9IHRoaXMubm9kZXNfZW5kX2F0W2xhc3RfcG9zXTtcbiAgICBpZiAocHJldl9ub2RlcyA9PSBudWxsKSB7XG4gICAgICAgIHByZXZfbm9kZXMgPSBbXTtcbiAgICB9XG4gICAgcHJldl9ub2Rlcy5wdXNoKG5vZGUpO1xuXG4gICAgdGhpcy5ub2Rlc19lbmRfYXRbbGFzdF9wb3NdID0gcHJldl9ub2Rlcztcbn07XG5cbi8qKlxuICogU2V0IGVuZHMgd2l0aCBFT1MgKEVuZCBvZiBTdGF0ZW1lbnQpXG4gKi9cblZpdGVyYmlMYXR0aWNlLnByb3RvdHlwZS5hcHBlbmRFb3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxhc3RfaW5kZXggPSB0aGlzLm5vZGVzX2VuZF9hdC5sZW5ndGg7XG4gICAgdGhpcy5lb3NfcG9zKys7XG4gICAgdGhpcy5ub2Rlc19lbmRfYXRbbGFzdF9pbmRleF0gPSBbIG5ldyBWaXRlcmJpTm9kZShcIkVPU1wiLCAwLCB0aGlzLmVvc19wb3MsIDAsIFwiRU9TXCIsIDAsIDApIF07XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gVml0ZXJiaUxhdHRpY2U7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=