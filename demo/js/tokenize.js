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

// require vue as MVVM framework
// require kuromoji

var DIC_URL = "kuromoji/dict/";

var tokenizer = null;
// var lattice;  // Very large object. Unwatch this object from Model.
// var renderer = new dagreD3.Renderer();


var vm = new Vue({
    el: "#demo",
    data: {
        inputText: "",
        tokens: [],
        isLoading: true,
        message: "Loading dictionaries ...",
        svgStyle: "hidden"
    },
    methods: {
        /*
        drawGraph: function () {
            if (lattice != null) {
                drawLattice();
                vm.svgStyle = "visible";
            }
        },
        */
        tokenize: function () {
            if (vm.inputText == "" || tokenizer == null) {
                vm.tokens = [];
                // lattice = null;
                return;
            }
            try {
                // lattice = tokenizer.getLattice(vm.inputText);
                vm.tokens = tokenizer.tokenize(vm.inputText);
            } catch (e) {
                console.log(e);
                // lattice = null;
                vm.tokens = [];
            }
        }
    }
});


// フォームの内容が変化したらtokenizeする
vm.$watch("inputText", function (value) {
    // vm.graphEnabled = false;
    vm.svgStyle = "hidden";
    vm.tokenize();
});


// Load and prepare tokenizer
kuromoji.builder({ dicPath: DIC_URL }).build(function (error, _tokenizer) {
    if (error != null) {
        console.log(error);
    }
    tokenizer = _tokenizer;

    vm.message = "Ready";

    vm.inputText = "すもももももももものうち";
    vm.isLoading = false;
});


/*
function drawLattice () {
    // Create a new directed graph
    var g = new dagreD3.Digraph();

    // BOS
    var bos_node = lattice.nodes_end_at[0][0];
    g.addNode("0:BOS", { label: "BOS " + bos_node.cost });

    var i, j, k, nodes, node;

    // Draw node
    for (i = 1; i <= lattice.eos_pos; i++) {
        nodes = lattice.nodes_end_at[i];
        if (nodes == null) {
            continue;
        }
        for (j = 0; j < nodes.length; j++) {
            node = nodes[j];

            // Add nodes to the graph. The first argument is the node id. The second is
            // metadata about the node. In this case we're going to add labels to each of
            // our nodes.
            if (node.name == "EOS") {
                g.addNode(i + ":" + node.name, { label: node.name + " " + node.cost });
            } else {
                var features = tokenizer.token_info_dictionary.getFeatures(node.name);
                g.addNode(i + ":" + node.name, {
                    label: "<div>"  // + node.left_id + " " + node.name + " " + node.right_id + "<br />"
                        + features[0] + "<br />" + features[1] + "<br />" + features[2] + "<br />" + node.cost + "</div>"
                });
            }
        }
    }

    // Draw edge
    for (i = 1; i <= lattice.eos_pos; i++) {
        nodes = lattice.nodes_end_at[i];
        if (nodes == null) {
            continue;
        }
        for (j = 0; j < nodes.length; j++) {
            node = nodes[j];
            // var cost = Number.MAX_VALUE;
            // var shortest_prev_node;

            var prev_nodes = lattice.nodes_end_at[node.start_pos - 1];
            if (prev_nodes == null) {
                // TODO process unknown words
                continue;
            }
            for (k = 0; k < prev_nodes.length; k++) {
                var prev_node = prev_nodes[k];

                var edge_cost;
                if (node.left_id == null || prev_node.right_id == null) {
                    console.log("Left or right is null");
                    edge_cost = 0;
                } else {
                    edge_cost = tokenizer.viterbi_searcher.connection_costs.get(prev_node.right_id, node.left_id);
                }

                // Add edges to the graph. The first argument is the edge id. Here we use null
                // to indicate that an arbitrary edge id can be assigned automatically. The
                // second argument is the source of the edge. The third argument is the target
                // of the edge. The last argument is the edge metadata.
                g.addEdge(
                        (node.start_pos - 1) + ":" + prev_node.name + "-" + i + ":" + node.name,
                        (node.start_pos - 1) + ":" + prev_node.name,
                        i + ":" + node.name,
                    { label: String(edge_cost) });

                // TODO If best path, strong this edge
                // edge_metadata.style = "stroke: #f66; stroke-width: 3px;";
            }
        }
    }

    var layout = dagreD3.layout()
        .nodeSep(20)
        .edgeSep(20)
        .rankDir("LR");
    renderer.layout(layout).run(g, d3.select("svg g"));
}
*/