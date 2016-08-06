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
 * ViterbiNode is a node of ViterbiLattice
 * @param {number} node_name Word ID
 * @param {number} node_cost Word cost to generate
 * @param {number} start_pos Start position from 1
 * @param {number} length Word length
 * @param {string} type Node type (KNOWN, UNKNOWN, BOS, EOS, ...)
 * @param {number} left_id Left context ID
 * @param {number} right_id Right context ID
 * @param {string} surface_form Surface form of this word
 * @constructor
 */
function ViterbiNode(node_name, node_cost, start_pos, length, type, left_id, right_id, surface_form) {
    this.name = node_name;
    this.cost = node_cost;
    this.start_pos = start_pos;
    this.length = length;
    this.left_id = left_id;
    this.right_id = right_id;
    this.prev = null;
    this.surface_form = surface_form;
    if (type === "BOS") {
        this.shortest_cost = 0;
    } else {
        this.shortest_cost = Number.MAX_VALUE;
    }
    this.type = type;
}

module.exports = ViterbiNode;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aXRlcmJpL1ZpdGVyYmlOb2RlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNCBUYWt1eWEgQXNhbm9cbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQXRpbGlrYSBJbmMuIGFuZCBjb250cmlidXRvcnNcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogVml0ZXJiaU5vZGUgaXMgYSBub2RlIG9mIFZpdGVyYmlMYXR0aWNlXG4gKiBAcGFyYW0ge251bWJlcn0gbm9kZV9uYW1lIFdvcmQgSURcbiAqIEBwYXJhbSB7bnVtYmVyfSBub2RlX2Nvc3QgV29yZCBjb3N0IHRvIGdlbmVyYXRlXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnRfcG9zIFN0YXJ0IHBvc2l0aW9uIGZyb20gMVxuICogQHBhcmFtIHtudW1iZXJ9IGxlbmd0aCBXb3JkIGxlbmd0aFxuICogQHBhcmFtIHtzdHJpbmd9IHR5cGUgTm9kZSB0eXBlIChLTk9XTiwgVU5LTk9XTiwgQk9TLCBFT1MsIC4uLilcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZWZ0X2lkIExlZnQgY29udGV4dCBJRFxuICogQHBhcmFtIHtudW1iZXJ9IHJpZ2h0X2lkIFJpZ2h0IGNvbnRleHQgSURcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdXJmYWNlX2Zvcm0gU3VyZmFjZSBmb3JtIG9mIHRoaXMgd29yZFxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIFZpdGVyYmlOb2RlKG5vZGVfbmFtZSwgbm9kZV9jb3N0LCBzdGFydF9wb3MsIGxlbmd0aCwgdHlwZSwgbGVmdF9pZCwgcmlnaHRfaWQsIHN1cmZhY2VfZm9ybSkge1xuICAgIHRoaXMubmFtZSA9IG5vZGVfbmFtZTtcbiAgICB0aGlzLmNvc3QgPSBub2RlX2Nvc3Q7XG4gICAgdGhpcy5zdGFydF9wb3MgPSBzdGFydF9wb3M7XG4gICAgdGhpcy5sZW5ndGggPSBsZW5ndGg7XG4gICAgdGhpcy5sZWZ0X2lkID0gbGVmdF9pZDtcbiAgICB0aGlzLnJpZ2h0X2lkID0gcmlnaHRfaWQ7XG4gICAgdGhpcy5wcmV2ID0gbnVsbDtcbiAgICB0aGlzLnN1cmZhY2VfZm9ybSA9IHN1cmZhY2VfZm9ybTtcbiAgICBpZiAodHlwZSA9PT0gXCJCT1NcIikge1xuICAgICAgICB0aGlzLnNob3J0ZXN0X2Nvc3QgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuc2hvcnRlc3RfY29zdCA9IE51bWJlci5NQVhfVkFMVUU7XG4gICAgfVxuICAgIHRoaXMudHlwZSA9IHR5cGU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVml0ZXJiaU5vZGU7XG4iXSwiZmlsZSI6InZpdGVyYmkvVml0ZXJiaU5vZGUuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
