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
 * ViterbiSearcher is for searching best Viterbi path
 * @param {ConnectionCosts} connection_costs Connection costs matrix
 * @constructor
 */
function ViterbiSearcher(connection_costs) {
    this.connection_costs = connection_costs;
}

/**
 * Search best path by forward-backward algorithm
 * @param {ViterbiLattice} lattice Viterbi lattice to search
 * @returns {Array} Shortest path
 */
ViterbiSearcher.prototype.search = function (lattice) {
    lattice = this.forward(lattice);
    return this.backward(lattice);
};

ViterbiSearcher.prototype.forward = function (lattice) {
    var i, j, k;
    for (i = 1; i <= lattice.eos_pos; i++) {
        var nodes = lattice.nodes_end_at[i];
        if (nodes == null) {
            continue;
        }
        for (j = 0; j < nodes.length; j++) {
            var node = nodes[j];
            var cost = Number.MAX_VALUE;
            var shortest_prev_node;

            var prev_nodes = lattice.nodes_end_at[node.start_pos - 1];
            if (prev_nodes == null) {
                // TODO process unknown words (repair word lattice)
                continue;
            }
            for (k = 0; k < prev_nodes.length; k++) {
                var prev_node = prev_nodes[k];

                var edge_cost;
                if (node.left_id == null || prev_node.right_id == null) {
                    // TODO assert
                    console.log("Left or right is null");
                    edge_cost = 0;
                } else {
                    edge_cost = this.connection_costs.get(prev_node.right_id, node.left_id);
                }

                var _cost = prev_node.shortest_cost + edge_cost + node.cost;
                if (_cost < cost) {
                    shortest_prev_node = prev_node;
                    cost = _cost;
                }
            }

            node.prev = shortest_prev_node;
            node.shortest_cost = cost;
        }
    }
    return lattice;
};

ViterbiSearcher.prototype.backward = function (lattice) {
    var shortest_path = [];
    var eos = lattice.nodes_end_at[lattice.nodes_end_at.length - 1][0];

    var node_back = eos.prev;
    if (node_back == null) {
        return [];
    }
    while (node_back.type !== "BOS") {
        shortest_path.push(node_back);
        if (node_back.prev == null) {
            // TODO Failed to back. Process unknown words?
            return [];
        }
        node_back = node_back.prev;
    }

    return shortest_path.reverse();
};


module.exports = ViterbiSearcher;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidml0ZXJiaS9WaXRlcmJpU2VhcmNoZXIuanMiLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aXRlcmJpL1ZpdGVyYmlTZWFyY2hlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBWaXRlcmJpU2VhcmNoZXIgaXMgZm9yIHNlYXJjaGluZyBiZXN0IFZpdGVyYmkgcGF0aFxuICogQHBhcmFtIHtDb25uZWN0aW9uQ29zdHN9IGNvbm5lY3Rpb25fY29zdHMgQ29ubmVjdGlvbiBjb3N0cyBtYXRyaXhcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBWaXRlcmJpU2VhcmNoZXIoY29ubmVjdGlvbl9jb3N0cykge1xuICAgIHRoaXMuY29ubmVjdGlvbl9jb3N0cyA9IGNvbm5lY3Rpb25fY29zdHM7XG59XG5cbi8qKlxuICogU2VhcmNoIGJlc3QgcGF0aCBieSBmb3J3YXJkLWJhY2t3YXJkIGFsZ29yaXRobVxuICogQHBhcmFtIHtWaXRlcmJpTGF0dGljZX0gbGF0dGljZSBWaXRlcmJpIGxhdHRpY2UgdG8gc2VhcmNoXG4gKiBAcmV0dXJucyB7QXJyYXl9IFNob3J0ZXN0IHBhdGhcbiAqL1xuVml0ZXJiaVNlYXJjaGVyLnByb3RvdHlwZS5zZWFyY2ggPSBmdW5jdGlvbiAobGF0dGljZSkge1xuICAgIGxhdHRpY2UgPSB0aGlzLmZvcndhcmQobGF0dGljZSk7XG4gICAgcmV0dXJuIHRoaXMuYmFja3dhcmQobGF0dGljZSk7XG59O1xuXG5WaXRlcmJpU2VhcmNoZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAobGF0dGljZSkge1xuICAgIHZhciBpLCBqLCBrO1xuICAgIGZvciAoaSA9IDE7IGkgPD0gbGF0dGljZS5lb3NfcG9zOyBpKyspIHtcbiAgICAgICAgdmFyIG5vZGVzID0gbGF0dGljZS5ub2Rlc19lbmRfYXRbaV07XG4gICAgICAgIGlmIChub2RlcyA9PSBudWxsKSB7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGogPSAwOyBqIDwgbm9kZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gbm9kZXNbal07XG4gICAgICAgICAgICB2YXIgY29zdCA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgICAgICAgICB2YXIgc2hvcnRlc3RfcHJldl9ub2RlO1xuXG4gICAgICAgICAgICB2YXIgcHJldl9ub2RlcyA9IGxhdHRpY2Uubm9kZXNfZW5kX2F0W25vZGUuc3RhcnRfcG9zIC0gMV07XG4gICAgICAgICAgICBpZiAocHJldl9ub2RlcyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETyBwcm9jZXNzIHVua25vd24gd29yZHMgKHJlcGFpciB3b3JkIGxhdHRpY2UpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGsgPSAwOyBrIDwgcHJldl9ub2Rlcy5sZW5ndGg7IGsrKykge1xuICAgICAgICAgICAgICAgIHZhciBwcmV2X25vZGUgPSBwcmV2X25vZGVzW2tdO1xuXG4gICAgICAgICAgICAgICAgdmFyIGVkZ2VfY29zdDtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5sZWZ0X2lkID09IG51bGwgfHwgcHJldl9ub2RlLnJpZ2h0X2lkID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETyBhc3NlcnRcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJMZWZ0IG9yIHJpZ2h0IGlzIG51bGxcIik7XG4gICAgICAgICAgICAgICAgICAgIGVkZ2VfY29zdCA9IDA7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWRnZV9jb3N0ID0gdGhpcy5jb25uZWN0aW9uX2Nvc3RzLmdldChwcmV2X25vZGUucmlnaHRfaWQsIG5vZGUubGVmdF9pZCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIF9jb3N0ID0gcHJldl9ub2RlLnNob3J0ZXN0X2Nvc3QgKyBlZGdlX2Nvc3QgKyBub2RlLmNvc3Q7XG4gICAgICAgICAgICAgICAgaWYgKF9jb3N0IDwgY29zdCkge1xuICAgICAgICAgICAgICAgICAgICBzaG9ydGVzdF9wcmV2X25vZGUgPSBwcmV2X25vZGU7XG4gICAgICAgICAgICAgICAgICAgIGNvc3QgPSBfY29zdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG5vZGUucHJldiA9IHNob3J0ZXN0X3ByZXZfbm9kZTtcbiAgICAgICAgICAgIG5vZGUuc2hvcnRlc3RfY29zdCA9IGNvc3Q7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxhdHRpY2U7XG59O1xuXG5WaXRlcmJpU2VhcmNoZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKGxhdHRpY2UpIHtcbiAgICB2YXIgc2hvcnRlc3RfcGF0aCA9IFtdO1xuICAgIHZhciBlb3MgPSBsYXR0aWNlLm5vZGVzX2VuZF9hdFtsYXR0aWNlLm5vZGVzX2VuZF9hdC5sZW5ndGggLSAxXVswXTtcblxuICAgIHZhciBub2RlX2JhY2sgPSBlb3MucHJldjtcbiAgICBpZiAobm9kZV9iYWNrID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICB3aGlsZSAobm9kZV9iYWNrLnR5cGUgIT09IFwiQk9TXCIpIHtcbiAgICAgICAgc2hvcnRlc3RfcGF0aC5wdXNoKG5vZGVfYmFjayk7XG4gICAgICAgIGlmIChub2RlX2JhY2sucHJldiA9PSBudWxsKSB7XG4gICAgICAgICAgICAvLyBUT0RPIEZhaWxlZCB0byBiYWNrLiBQcm9jZXNzIHVua25vd24gd29yZHM/XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgbm9kZV9iYWNrID0gbm9kZV9iYWNrLnByZXY7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNob3J0ZXN0X3BhdGgucmV2ZXJzZSgpO1xufTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpdGVyYmlTZWFyY2hlcjtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==