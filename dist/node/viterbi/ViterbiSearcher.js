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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aXRlcmJpL1ZpdGVyYmlTZWFyY2hlci5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IDIwMTQgVGFrdXlhIEFzYW5vXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IEF0aWxpa2EgSW5jLiBhbmQgY29udHJpYnV0b3JzXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIFZpdGVyYmlTZWFyY2hlciBpcyBmb3Igc2VhcmNoaW5nIGJlc3QgVml0ZXJiaSBwYXRoXG4gKiBAcGFyYW0ge0Nvbm5lY3Rpb25Db3N0c30gY29ubmVjdGlvbl9jb3N0cyBDb25uZWN0aW9uIGNvc3RzIG1hdHJpeFxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFZpdGVyYmlTZWFyY2hlcihjb25uZWN0aW9uX2Nvc3RzKSB7XG4gICAgdGhpcy5jb25uZWN0aW9uX2Nvc3RzID0gY29ubmVjdGlvbl9jb3N0cztcbn1cblxuLyoqXG4gKiBTZWFyY2ggYmVzdCBwYXRoIGJ5IGZvcndhcmQtYmFja3dhcmQgYWxnb3JpdGhtXG4gKiBAcGFyYW0ge1ZpdGVyYmlMYXR0aWNlfSBsYXR0aWNlIFZpdGVyYmkgbGF0dGljZSB0byBzZWFyY2hcbiAqIEByZXR1cm5zIHtBcnJheX0gU2hvcnRlc3QgcGF0aFxuICovXG5WaXRlcmJpU2VhcmNoZXIucHJvdG90eXBlLnNlYXJjaCA9IGZ1bmN0aW9uIChsYXR0aWNlKSB7XG4gICAgbGF0dGljZSA9IHRoaXMuZm9yd2FyZChsYXR0aWNlKTtcbiAgICByZXR1cm4gdGhpcy5iYWNrd2FyZChsYXR0aWNlKTtcbn07XG5cblZpdGVyYmlTZWFyY2hlci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChsYXR0aWNlKSB7XG4gICAgdmFyIGksIGosIGs7XG4gICAgZm9yIChpID0gMTsgaSA8PSBsYXR0aWNlLmVvc19wb3M7IGkrKykge1xuICAgICAgICB2YXIgbm9kZXMgPSBsYXR0aWNlLm5vZGVzX2VuZF9hdFtpXTtcbiAgICAgICAgaWYgKG5vZGVzID09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBub2Rlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSBub2Rlc1tqXTtcbiAgICAgICAgICAgIHZhciBjb3N0ID0gTnVtYmVyLk1BWF9WQUxVRTtcbiAgICAgICAgICAgIHZhciBzaG9ydGVzdF9wcmV2X25vZGU7XG5cbiAgICAgICAgICAgIHZhciBwcmV2X25vZGVzID0gbGF0dGljZS5ub2Rlc19lbmRfYXRbbm9kZS5zdGFydF9wb3MgLSAxXTtcbiAgICAgICAgICAgIGlmIChwcmV2X25vZGVzID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPIHByb2Nlc3MgdW5rbm93biB3b3JkcyAocmVwYWlyIHdvcmQgbGF0dGljZSlcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoayA9IDA7IGsgPCBwcmV2X25vZGVzLmxlbmd0aDsgaysrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHByZXZfbm9kZSA9IHByZXZfbm9kZXNba107XG5cbiAgICAgICAgICAgICAgICB2YXIgZWRnZV9jb3N0O1xuICAgICAgICAgICAgICAgIGlmIChub2RlLmxlZnRfaWQgPT0gbnVsbCB8fCBwcmV2X25vZGUucmlnaHRfaWQgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPIGFzc2VydFxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkxlZnQgb3IgcmlnaHQgaXMgbnVsbFwiKTtcbiAgICAgICAgICAgICAgICAgICAgZWRnZV9jb3N0ID0gMDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlZGdlX2Nvc3QgPSB0aGlzLmNvbm5lY3Rpb25fY29zdHMuZ2V0KHByZXZfbm9kZS5yaWdodF9pZCwgbm9kZS5sZWZ0X2lkKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgX2Nvc3QgPSBwcmV2X25vZGUuc2hvcnRlc3RfY29zdCArIGVkZ2VfY29zdCArIG5vZGUuY29zdDtcbiAgICAgICAgICAgICAgICBpZiAoX2Nvc3QgPCBjb3N0KSB7XG4gICAgICAgICAgICAgICAgICAgIHNob3J0ZXN0X3ByZXZfbm9kZSA9IHByZXZfbm9kZTtcbiAgICAgICAgICAgICAgICAgICAgY29zdCA9IF9jb3N0O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbm9kZS5wcmV2ID0gc2hvcnRlc3RfcHJldl9ub2RlO1xuICAgICAgICAgICAgbm9kZS5zaG9ydGVzdF9jb3N0ID0gY29zdDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbGF0dGljZTtcbn07XG5cblZpdGVyYmlTZWFyY2hlci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAobGF0dGljZSkge1xuICAgIHZhciBzaG9ydGVzdF9wYXRoID0gW107XG4gICAgdmFyIGVvcyA9IGxhdHRpY2Uubm9kZXNfZW5kX2F0W2xhdHRpY2Uubm9kZXNfZW5kX2F0Lmxlbmd0aCAtIDFdWzBdO1xuXG4gICAgdmFyIG5vZGVfYmFjayA9IGVvcy5wcmV2O1xuICAgIGlmIChub2RlX2JhY2sgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHdoaWxlIChub2RlX2JhY2sudHlwZSAhPT0gXCJCT1NcIikge1xuICAgICAgICBzaG9ydGVzdF9wYXRoLnB1c2gobm9kZV9iYWNrKTtcbiAgICAgICAgaWYgKG5vZGVfYmFjay5wcmV2ID09IG51bGwpIHtcbiAgICAgICAgICAgIC8vIFRPRE8gRmFpbGVkIHRvIGJhY2suIFByb2Nlc3MgdW5rbm93biB3b3Jkcz9cbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICBub2RlX2JhY2sgPSBub2RlX2JhY2sucHJldjtcbiAgICB9XG5cbiAgICByZXR1cm4gc2hvcnRlc3RfcGF0aC5yZXZlcnNlKCk7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gVml0ZXJiaVNlYXJjaGVyO1xuIl0sImZpbGUiOiJ2aXRlcmJpL1ZpdGVyYmlTZWFyY2hlci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9