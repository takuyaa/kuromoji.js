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
 * @param {string} node_name
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ2aXRlcmJpL1ZpdGVyYmlOb2RlLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgMjAxNCBUYWt1eWEgQXNhbm9cbiAqIENvcHlyaWdodCAyMDEwLTIwMTQgQXRpbGlrYSBJbmMuIGFuZCBjb250cmlidXRvcnNcbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qKlxuICogVml0ZXJiaU5vZGUgaXMgYSBub2RlIG9mIFZpdGVyYmlMYXR0aWNlXG4gKiBAcGFyYW0ge3N0cmluZ30gbm9kZV9uYW1lXG4gKiBAcGFyYW0ge251bWJlcn0gbm9kZV9jb3N0IFdvcmQgY29zdCB0byBnZW5lcmF0ZVxuICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0X3BvcyBTdGFydCBwb3NpdGlvbiBmcm9tIDFcbiAqIEBwYXJhbSB7bnVtYmVyfSBsZW5ndGggV29yZCBsZW5ndGhcbiAqIEBwYXJhbSB7c3RyaW5nfSB0eXBlIE5vZGUgdHlwZSAoS05PV04sIFVOS05PV04sIEJPUywgRU9TLCAuLi4pXG4gKiBAcGFyYW0ge251bWJlcn0gbGVmdF9pZCBMZWZ0IGNvbnRleHQgSURcbiAqIEBwYXJhbSB7bnVtYmVyfSByaWdodF9pZCBSaWdodCBjb250ZXh0IElEXG4gKiBAcGFyYW0ge3N0cmluZ30gc3VyZmFjZV9mb3JtIFN1cmZhY2UgZm9ybSBvZiB0aGlzIHdvcmRcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBWaXRlcmJpTm9kZShub2RlX25hbWUsIG5vZGVfY29zdCwgc3RhcnRfcG9zLCBsZW5ndGgsIHR5cGUsIGxlZnRfaWQsIHJpZ2h0X2lkLCBzdXJmYWNlX2Zvcm0pIHtcbiAgICB0aGlzLm5hbWUgPSBub2RlX25hbWU7XG4gICAgdGhpcy5jb3N0ID0gbm9kZV9jb3N0O1xuICAgIHRoaXMuc3RhcnRfcG9zID0gc3RhcnRfcG9zO1xuICAgIHRoaXMubGVuZ3RoID0gbGVuZ3RoO1xuICAgIHRoaXMubGVmdF9pZCA9IGxlZnRfaWQ7XG4gICAgdGhpcy5yaWdodF9pZCA9IHJpZ2h0X2lkO1xuICAgIHRoaXMucHJldiA9IG51bGw7XG4gICAgdGhpcy5zdXJmYWNlX2Zvcm0gPSBzdXJmYWNlX2Zvcm07XG4gICAgaWYgKHR5cGUgPT09IFwiQk9TXCIpIHtcbiAgICAgICAgdGhpcy5zaG9ydGVzdF9jb3N0ID0gMDtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnNob3J0ZXN0X2Nvc3QgPSBOdW1iZXIuTUFYX1ZBTFVFO1xuICAgIH1cbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gVml0ZXJiaU5vZGU7XG4iXSwiZmlsZSI6InZpdGVyYmkvVml0ZXJiaU5vZGUuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==