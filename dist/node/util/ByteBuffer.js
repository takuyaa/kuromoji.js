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
 * Convert String (UTF-16) to UTF-8 ArrayBuffer
 *
 * @param {String} str UTF-16 string to convert
 * @return {Uint8Array} Byte sequence encoded by UTF-8
 */
var stringToUtf8Bytes = function (str) {

    // Max size of 1 character is 4 bytes
    var bytes = new Uint8Array(str.length * 4);

    var i = 0, j = 0;

    while (i < str.length) {
        var unicode_code;

        var utf16_code = str.charCodeAt(i++);
        if (utf16_code >= 0xD800 && utf16_code <= 0xDBFF) {
            // surrogate pair
            var upper = utf16_code;           // high surrogate
            var lower = str.charCodeAt(i++);  // low surrogate

            if (lower >= 0xDC00 && lower <= 0xDFFF) {
                unicode_code =
                    (upper - 0xD800) * (1 << 10) + (1 << 16) +
                    (lower - 0xDC00);
            } else {
                // malformed surrogate pair
                return null;
            }
        } else {
            // not surrogate code
            unicode_code = utf16_code;
        }

        if (unicode_code < 0x80) {
            // 1-byte
            bytes[j++] = unicode_code;

        } else if (unicode_code < (1 << 11)) {
            // 2-byte
            bytes[j++] = (unicode_code >>> 6) | 0xC0;
            bytes[j++] = (unicode_code & 0x3F) | 0x80;

        } else if (unicode_code < (1 << 16)) {
            // 3-byte
            bytes[j++] = (unicode_code >>> 12) | 0xE0;
            bytes[j++] = ((unicode_code >> 6) & 0x3f) | 0x80;
            bytes[j++] = (unicode_code & 0x3F) | 0x80;

        } else if (unicode_code < (1 << 21)) {
            // 4-byte
            bytes[j++] = (unicode_code >>> 18) | 0xF0;
            bytes[j++] = ((unicode_code >> 12) & 0x3F) | 0x80;
            bytes[j++] = ((unicode_code >> 6) & 0x3F) | 0x80;
            bytes[j++] = (unicode_code & 0x3F) | 0x80;

        } else {
            // malformed UCS4 code
        }
    }

    return bytes.subarray(0, j);
};

/**
 * Convert UTF-8 ArrayBuffer to String (UTF-16)
 *
 * @param {Array} bytes UTF-8 byte sequence to convert
 * @return {String} String encoded by UTF-16
 */
var utf8BytesToString = function (bytes) {

    var str = "";
    var code, b1, b2, b3, b4, upper, lower;
    var i = 0;

    while (i < bytes.length) {

        b1 = bytes[i++];

        if (b1 < 0x80) {
            // 1 byte
            code = b1;
        } else if ((b1 >> 5) === 0x06) {
            // 2 bytes
            b2 = bytes[i++];
            code = ((b1 & 0x1f) << 6) | (b2 & 0x3f);
        } else if ((b1 >> 4) === 0x0e) {
            // 3 bytes
            b2 = bytes[i++];
            b3 = bytes[i++];
            code = ((b1 & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
        } else {
            // 4 bytes
            b2 = bytes[i++];
            b3 = bytes[i++];
            b4 = bytes[i++];
            code = ((b1 & 0x07) << 18) | ((b2 & 0x3f) << 12) | ((b3 & 0x3f) << 6) | (b4 & 0x3f);
        }

        if (code < 0x10000) {
            str += String.fromCharCode(code);
        } else {
            // surrogate pair
            code -= 0x10000;
            upper = (0xD800 | (code >> 10));
            lower = (0xDC00 | (code & 0x3FF));
            str += String.fromCharCode(upper, lower);
        }
    }

    return str;
};

/**
 * Utilities to manipulate byte sequence
 * @param {(number|Uint8Array)} arg Initial size of this buffer (number), or buffer to set (Uint8Array)
 * @constructor
 */
function ByteBuffer(arg) {
    var initial_size;
    if (arg == null) {
        initial_size = 1024 * 1024;
    } else if (typeof arg === "number") {
        initial_size = arg;
    } else if (arg instanceof Uint8Array) {
        this.buffer = arg;
        this.position = 0;  // Overwrite
        return;
    } else {
        // typeof arg -> String
        throw typeof arg + " is invalid parameter type for ByteBuffer constructor";
    }
    // arg is null or number
    this.buffer = new Uint8Array(initial_size);
    this.position = 0;
}

ByteBuffer.prototype.size = function () {
    return this.buffer.length;
};

ByteBuffer.prototype.reallocate = function () {
    var new_array = new Uint8Array(this.buffer.length * 2);
    new_array.set(this.buffer);
    this.buffer = new_array;
};

ByteBuffer.prototype.shrink = function () {
    this.buffer = this.buffer.subarray(0, this.position);
    return this.buffer;
};

ByteBuffer.prototype.put = function (b) {
    if (this.buffer.length < this.position + 1) {
        this.reallocate();
    }
    this.buffer[this.position++] = b;
};

ByteBuffer.prototype.get = function (index) {
    if (index == null) {
        index = this.position;
        this.position += 1;
    }
    if (this.buffer.length < index + 1) {
        return 0;
    }
    return this.buffer[index];
};

// Write short to buffer by little endian
ByteBuffer.prototype.putShort = function (num) {
    if (0xFFFF < num) {
        throw num + " is over short value";
    }
    var lower = (0x00FF & num);
    var upper = (0xFF00 & num) >> 8;
    this.put(lower);
    this.put(upper);
};

// Read short from buffer by little endian
ByteBuffer.prototype.getShort = function (index) {
    if (index == null) {
        index = this.position;
        this.position += 2;
    }
    if (this.buffer.length < index + 2) {
        return 0;
    }
    var lower = this.buffer[index];
    var upper = this.buffer[index + 1];
    return (upper << 8) + lower;
};

// Write integer to buffer by little endian
ByteBuffer.prototype.putInt = function (num) {
    if (0xFFFFFFFF < num) {
        throw num + " is over integer value";
    }
    var b0 = (0x000000FF & num);
    var b1 = (0x0000FF00 & num) >> 8;
    var b2 = (0x00FF0000 & num) >> 16;
    var b3 = (0xFF000000 & num) >> 24;
    this.put(b0);
    this.put(b1);
    this.put(b2);
    this.put(b3);
};

// Read integer from buffer by little endian
ByteBuffer.prototype.getInt = function (index) {
    if (index == null) {
        index = this.position;
        this.position += 4;
    }
    if (this.buffer.length < index + 4) {
        return 0;
    }
    var b0 = this.buffer[index];
    var b1 = this.buffer[index + 1];
    var b2 = this.buffer[index + 2];
    var b3 = this.buffer[index + 3];

    return (b3 << 24) + (b2 << 16) + (b1 << 8) + b0;
};

ByteBuffer.prototype.readInt = function () {
    var pos = this.position;
    this.position += 4;
    return this.getInt(pos);
};

ByteBuffer.prototype.putString = function (str) {
    var bytes = stringToUtf8Bytes(str);
    for (var i = 0; i < bytes.length; i++) {
        this.put(bytes[i]);
    }
    // put null character as terminal character
    this.put(0);
};

ByteBuffer.prototype.getString = function (index) {
    var buf = [],
        ch;
    if (index == null) {
        index = this.position;
    }
    while (true) {
        if (this.buffer.length < index + 1) {
            break;
        }
        ch = this.get(index++);
        if (ch === 0) {
            break;
        } else {
            buf.push(ch);
        }
    }
    this.position = index;
    return utf8BytesToString(buf);
};

module.exports = ByteBuffer;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ1dGlsL0J5dGVCdWZmZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBDb252ZXJ0IFN0cmluZyAoVVRGLTE2KSB0byBVVEYtOCBBcnJheUJ1ZmZlclxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVVRGLTE2IHN0cmluZyB0byBjb252ZXJ0XG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fSBCeXRlIHNlcXVlbmNlIGVuY29kZWQgYnkgVVRGLThcbiAqL1xudmFyIHN0cmluZ1RvVXRmOEJ5dGVzID0gZnVuY3Rpb24gKHN0cikge1xuXG4gICAgLy8gTWF4IHNpemUgb2YgMSBjaGFyYWN0ZXIgaXMgNCBieXRlc1xuICAgIHZhciBieXRlcyA9IG5ldyBVaW50OEFycmF5KHN0ci5sZW5ndGggKiA0KTtcblxuICAgIHZhciBpID0gMCwgaiA9IDA7XG5cbiAgICB3aGlsZSAoaSA8IHN0ci5sZW5ndGgpIHtcbiAgICAgICAgdmFyIHVuaWNvZGVfY29kZTtcblxuICAgICAgICB2YXIgdXRmMTZfY29kZSA9IHN0ci5jaGFyQ29kZUF0KGkrKyk7XG4gICAgICAgIGlmICh1dGYxNl9jb2RlID49IDB4RDgwMCAmJiB1dGYxNl9jb2RlIDw9IDB4REJGRikge1xuICAgICAgICAgICAgLy8gc3Vycm9nYXRlIHBhaXJcbiAgICAgICAgICAgIHZhciB1cHBlciA9IHV0ZjE2X2NvZGU7ICAgICAgICAgICAvLyBoaWdoIHN1cnJvZ2F0ZVxuICAgICAgICAgICAgdmFyIGxvd2VyID0gc3RyLmNoYXJDb2RlQXQoaSsrKTsgIC8vIGxvdyBzdXJyb2dhdGVcblxuICAgICAgICAgICAgaWYgKGxvd2VyID49IDB4REMwMCAmJiBsb3dlciA8PSAweERGRkYpIHtcbiAgICAgICAgICAgICAgICB1bmljb2RlX2NvZGUgPVxuICAgICAgICAgICAgICAgICAgICAodXBwZXIgLSAweEQ4MDApICogKDEgPDwgMTApICsgKDEgPDwgMTYpICtcbiAgICAgICAgICAgICAgICAgICAgKGxvd2VyIC0gMHhEQzAwKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gbWFsZm9ybWVkIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBub3Qgc3Vycm9nYXRlIGNvZGVcbiAgICAgICAgICAgIHVuaWNvZGVfY29kZSA9IHV0ZjE2X2NvZGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodW5pY29kZV9jb2RlIDwgMHg4MCkge1xuICAgICAgICAgICAgLy8gMS1ieXRlXG4gICAgICAgICAgICBieXRlc1tqKytdID0gdW5pY29kZV9jb2RlO1xuXG4gICAgICAgIH0gZWxzZSBpZiAodW5pY29kZV9jb2RlIDwgKDEgPDwgMTEpKSB7XG4gICAgICAgICAgICAvLyAyLWJ5dGVcbiAgICAgICAgICAgIGJ5dGVzW2orK10gPSAodW5pY29kZV9jb2RlID4+PiA2KSB8IDB4QzA7XG4gICAgICAgICAgICBieXRlc1tqKytdID0gKHVuaWNvZGVfY29kZSAmIDB4M0YpIHwgMHg4MDtcblxuICAgICAgICB9IGVsc2UgaWYgKHVuaWNvZGVfY29kZSA8ICgxIDw8IDE2KSkge1xuICAgICAgICAgICAgLy8gMy1ieXRlXG4gICAgICAgICAgICBieXRlc1tqKytdID0gKHVuaWNvZGVfY29kZSA+Pj4gMTIpIHwgMHhFMDtcbiAgICAgICAgICAgIGJ5dGVzW2orK10gPSAoKHVuaWNvZGVfY29kZSA+PiA2KSAmIDB4M2YpIHwgMHg4MDtcbiAgICAgICAgICAgIGJ5dGVzW2orK10gPSAodW5pY29kZV9jb2RlICYgMHgzRikgfCAweDgwO1xuXG4gICAgICAgIH0gZWxzZSBpZiAodW5pY29kZV9jb2RlIDwgKDEgPDwgMjEpKSB7XG4gICAgICAgICAgICAvLyA0LWJ5dGVcbiAgICAgICAgICAgIGJ5dGVzW2orK10gPSAodW5pY29kZV9jb2RlID4+PiAxOCkgfCAweEYwO1xuICAgICAgICAgICAgYnl0ZXNbaisrXSA9ICgodW5pY29kZV9jb2RlID4+IDEyKSAmIDB4M0YpIHwgMHg4MDtcbiAgICAgICAgICAgIGJ5dGVzW2orK10gPSAoKHVuaWNvZGVfY29kZSA+PiA2KSAmIDB4M0YpIHwgMHg4MDtcbiAgICAgICAgICAgIGJ5dGVzW2orK10gPSAodW5pY29kZV9jb2RlICYgMHgzRikgfCAweDgwO1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBtYWxmb3JtZWQgVUNTNCBjb2RlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYnl0ZXMuc3ViYXJyYXkoMCwgaik7XG59O1xuXG4vKipcbiAqIENvbnZlcnQgVVRGLTggQXJyYXlCdWZmZXIgdG8gU3RyaW5nIChVVEYtMTYpXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYnl0ZXMgVVRGLTggYnl0ZSBzZXF1ZW5jZSB0byBjb252ZXJ0XG4gKiBAcmV0dXJuIHtTdHJpbmd9IFN0cmluZyBlbmNvZGVkIGJ5IFVURi0xNlxuICovXG52YXIgdXRmOEJ5dGVzVG9TdHJpbmcgPSBmdW5jdGlvbiAoYnl0ZXMpIHtcblxuICAgIHZhciBzdHIgPSBcIlwiO1xuICAgIHZhciBjb2RlLCBiMSwgYjIsIGIzLCBiNCwgdXBwZXIsIGxvd2VyO1xuICAgIHZhciBpID0gMDtcblxuICAgIHdoaWxlIChpIDwgYnl0ZXMubGVuZ3RoKSB7XG5cbiAgICAgICAgYjEgPSBieXRlc1tpKytdO1xuXG4gICAgICAgIGlmIChiMSA8IDB4ODApIHtcbiAgICAgICAgICAgIC8vIDEgYnl0ZVxuICAgICAgICAgICAgY29kZSA9IGIxO1xuICAgICAgICB9IGVsc2UgaWYgKChiMSA+PiA1KSA9PT0gMHgwNikge1xuICAgICAgICAgICAgLy8gMiBieXRlc1xuICAgICAgICAgICAgYjIgPSBieXRlc1tpKytdO1xuICAgICAgICAgICAgY29kZSA9ICgoYjEgJiAweDFmKSA8PCA2KSB8IChiMiAmIDB4M2YpO1xuICAgICAgICB9IGVsc2UgaWYgKChiMSA+PiA0KSA9PT0gMHgwZSkge1xuICAgICAgICAgICAgLy8gMyBieXRlc1xuICAgICAgICAgICAgYjIgPSBieXRlc1tpKytdO1xuICAgICAgICAgICAgYjMgPSBieXRlc1tpKytdO1xuICAgICAgICAgICAgY29kZSA9ICgoYjEgJiAweDBmKSA8PCAxMikgfCAoKGIyICYgMHgzZikgPDwgNikgfCAoYjMgJiAweDNmKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIDQgYnl0ZXNcbiAgICAgICAgICAgIGIyID0gYnl0ZXNbaSsrXTtcbiAgICAgICAgICAgIGIzID0gYnl0ZXNbaSsrXTtcbiAgICAgICAgICAgIGI0ID0gYnl0ZXNbaSsrXTtcbiAgICAgICAgICAgIGNvZGUgPSAoKGIxICYgMHgwNykgPDwgMTgpIHwgKChiMiAmIDB4M2YpIDw8IDEyKSB8ICgoYjMgJiAweDNmKSA8PCA2KSB8IChiNCAmIDB4M2YpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvZGUgPCAweDEwMDAwKSB7XG4gICAgICAgICAgICBzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICAgICAgICBjb2RlIC09IDB4MTAwMDA7XG4gICAgICAgICAgICB1cHBlciA9ICgweEQ4MDAgfCAoY29kZSA+PiAxMCkpO1xuICAgICAgICAgICAgbG93ZXIgPSAoMHhEQzAwIHwgKGNvZGUgJiAweDNGRikpO1xuICAgICAgICAgICAgc3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUodXBwZXIsIGxvd2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzdHI7XG59O1xuXG4vKipcbiAqIFV0aWxpdGllcyB0byBtYW5pcHVsYXRlIGJ5dGUgc2VxdWVuY2VcbiAqIEBwYXJhbSB7KG51bWJlcnxVaW50OEFycmF5KX0gYXJnIEluaXRpYWwgc2l6ZSBvZiB0aGlzIGJ1ZmZlciAobnVtYmVyKSwgb3IgYnVmZmVyIHRvIHNldCAoVWludDhBcnJheSlcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBCeXRlQnVmZmVyKGFyZykge1xuICAgIHZhciBpbml0aWFsX3NpemU7XG4gICAgaWYgKGFyZyA9PSBudWxsKSB7XG4gICAgICAgIGluaXRpYWxfc2l6ZSA9IDEwMjQgKiAxMDI0O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICBpbml0aWFsX3NpemUgPSBhcmc7XG4gICAgfSBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XG4gICAgICAgIHRoaXMuYnVmZmVyID0gYXJnO1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gMDsgIC8vIE92ZXJ3cml0ZVxuICAgICAgICByZXR1cm47XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdHlwZW9mIGFyZyAtPiBTdHJpbmdcbiAgICAgICAgdGhyb3cgdHlwZW9mIGFyZyArIFwiIGlzIGludmFsaWQgcGFyYW1ldGVyIHR5cGUgZm9yIEJ5dGVCdWZmZXIgY29uc3RydWN0b3JcIjtcbiAgICB9XG4gICAgLy8gYXJnIGlzIG51bGwgb3IgbnVtYmVyXG4gICAgdGhpcy5idWZmZXIgPSBuZXcgVWludDhBcnJheShpbml0aWFsX3NpemUpO1xuICAgIHRoaXMucG9zaXRpb24gPSAwO1xufVxuXG5CeXRlQnVmZmVyLnByb3RvdHlwZS5zaXplID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmJ1ZmZlci5sZW5ndGg7XG59O1xuXG5CeXRlQnVmZmVyLnByb3RvdHlwZS5yZWFsbG9jYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBuZXdfYXJyYXkgPSBuZXcgVWludDhBcnJheSh0aGlzLmJ1ZmZlci5sZW5ndGggKiAyKTtcbiAgICBuZXdfYXJyYXkuc2V0KHRoaXMuYnVmZmVyKTtcbiAgICB0aGlzLmJ1ZmZlciA9IG5ld19hcnJheTtcbn07XG5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLnNocmluayA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmJ1ZmZlciA9IHRoaXMuYnVmZmVyLnN1YmFycmF5KDAsIHRoaXMucG9zaXRpb24pO1xuICAgIHJldHVybiB0aGlzLmJ1ZmZlcjtcbn07XG5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLnB1dCA9IGZ1bmN0aW9uIChiKSB7XG4gICAgaWYgKHRoaXMuYnVmZmVyLmxlbmd0aCA8IHRoaXMucG9zaXRpb24gKyAxKSB7XG4gICAgICAgIHRoaXMucmVhbGxvY2F0ZSgpO1xuICAgIH1cbiAgICB0aGlzLmJ1ZmZlclt0aGlzLnBvc2l0aW9uKytdID0gYjtcbn07XG5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICAgIGluZGV4ID0gdGhpcy5wb3NpdGlvbjtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiArPSAxO1xuICAgIH1cbiAgICBpZiAodGhpcy5idWZmZXIubGVuZ3RoIDwgaW5kZXggKyAxKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5idWZmZXJbaW5kZXhdO1xufTtcblxuLy8gV3JpdGUgc2hvcnQgdG8gYnVmZmVyIGJ5IGxpdHRsZSBlbmRpYW5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLnB1dFNob3J0ID0gZnVuY3Rpb24gKG51bSkge1xuICAgIGlmICgweEZGRkYgPCBudW0pIHtcbiAgICAgICAgdGhyb3cgbnVtICsgXCIgaXMgb3ZlciBzaG9ydCB2YWx1ZVwiO1xuICAgIH1cbiAgICB2YXIgbG93ZXIgPSAoMHgwMEZGICYgbnVtKTtcbiAgICB2YXIgdXBwZXIgPSAoMHhGRjAwICYgbnVtKSA+PiA4O1xuICAgIHRoaXMucHV0KGxvd2VyKTtcbiAgICB0aGlzLnB1dCh1cHBlcik7XG59O1xuXG4vLyBSZWFkIHNob3J0IGZyb20gYnVmZmVyIGJ5IGxpdHRsZSBlbmRpYW5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLmdldFNob3J0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgICAgaW5kZXggPSB0aGlzLnBvc2l0aW9uO1xuICAgICAgICB0aGlzLnBvc2l0aW9uICs9IDI7XG4gICAgfVxuICAgIGlmICh0aGlzLmJ1ZmZlci5sZW5ndGggPCBpbmRleCArIDIpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHZhciBsb3dlciA9IHRoaXMuYnVmZmVyW2luZGV4XTtcbiAgICB2YXIgdXBwZXIgPSB0aGlzLmJ1ZmZlcltpbmRleCArIDFdO1xuICAgIHJldHVybiAodXBwZXIgPDwgOCkgKyBsb3dlcjtcbn07XG5cbi8vIFdyaXRlIGludGVnZXIgdG8gYnVmZmVyIGJ5IGxpdHRsZSBlbmRpYW5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLnB1dEludCA9IGZ1bmN0aW9uIChudW0pIHtcbiAgICBpZiAoMHhGRkZGRkZGRiA8IG51bSkge1xuICAgICAgICB0aHJvdyBudW0gKyBcIiBpcyBvdmVyIGludGVnZXIgdmFsdWVcIjtcbiAgICB9XG4gICAgdmFyIGIwID0gKDB4MDAwMDAwRkYgJiBudW0pO1xuICAgIHZhciBiMSA9ICgweDAwMDBGRjAwICYgbnVtKSA+PiA4O1xuICAgIHZhciBiMiA9ICgweDAwRkYwMDAwICYgbnVtKSA+PiAxNjtcbiAgICB2YXIgYjMgPSAoMHhGRjAwMDAwMCAmIG51bSkgPj4gMjQ7XG4gICAgdGhpcy5wdXQoYjApO1xuICAgIHRoaXMucHV0KGIxKTtcbiAgICB0aGlzLnB1dChiMik7XG4gICAgdGhpcy5wdXQoYjMpO1xufTtcblxuLy8gUmVhZCBpbnRlZ2VyIGZyb20gYnVmZmVyIGJ5IGxpdHRsZSBlbmRpYW5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLmdldEludCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICAgIGluZGV4ID0gdGhpcy5wb3NpdGlvbjtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiArPSA0O1xuICAgIH1cbiAgICBpZiAodGhpcy5idWZmZXIubGVuZ3RoIDwgaW5kZXggKyA0KSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICB2YXIgYjAgPSB0aGlzLmJ1ZmZlcltpbmRleF07XG4gICAgdmFyIGIxID0gdGhpcy5idWZmZXJbaW5kZXggKyAxXTtcbiAgICB2YXIgYjIgPSB0aGlzLmJ1ZmZlcltpbmRleCArIDJdO1xuICAgIHZhciBiMyA9IHRoaXMuYnVmZmVyW2luZGV4ICsgM107XG5cbiAgICByZXR1cm4gKGIzIDw8IDI0KSArIChiMiA8PCAxNikgKyAoYjEgPDwgOCkgKyBiMDtcbn07XG5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLnJlYWRJbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHBvcyA9IHRoaXMucG9zaXRpb247XG4gICAgdGhpcy5wb3NpdGlvbiArPSA0O1xuICAgIHJldHVybiB0aGlzLmdldEludChwb3MpO1xufTtcblxuQnl0ZUJ1ZmZlci5wcm90b3R5cGUucHV0U3RyaW5nID0gZnVuY3Rpb24gKHN0cikge1xuICAgIHZhciBieXRlcyA9IHN0cmluZ1RvVXRmOEJ5dGVzKHN0cik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLnB1dChieXRlc1tpXSk7XG4gICAgfVxuICAgIC8vIHB1dCBudWxsIGNoYXJhY3RlciBhcyB0ZXJtaW5hbCBjaGFyYWN0ZXJcbiAgICB0aGlzLnB1dCgwKTtcbn07XG5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLmdldFN0cmluZyA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgIHZhciBidWYgPSBbXSxcbiAgICAgICAgY2g7XG4gICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgICAgaW5kZXggPSB0aGlzLnBvc2l0aW9uO1xuICAgIH1cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBpZiAodGhpcy5idWZmZXIubGVuZ3RoIDwgaW5kZXggKyAxKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjaCA9IHRoaXMuZ2V0KGluZGV4KyspO1xuICAgICAgICBpZiAoY2ggPT09IDApIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYnVmLnB1c2goY2gpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRoaXMucG9zaXRpb24gPSBpbmRleDtcbiAgICByZXR1cm4gdXRmOEJ5dGVzVG9TdHJpbmcoYnVmKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQnl0ZUJ1ZmZlcjtcbiJdLCJmaWxlIjoidXRpbC9CeXRlQnVmZmVyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
