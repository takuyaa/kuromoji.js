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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJ1dGlsL0J5dGVCdWZmZXIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAyMDE0IFRha3V5YSBBc2Fub1xuICogQ29weXJpZ2h0IDIwMTAtMjAxNCBBdGlsaWthIEluYy4gYW5kIGNvbnRyaWJ1dG9yc1xuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cInVzZSBzdHJpY3RcIjtcblxuLyoqXG4gKiBDb252ZXJ0IFN0cmluZyAoVVRGLTE2KSB0byBVVEYtOCBBcnJheUJ1ZmZlclxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVVRGLTE2IHN0cmluZyB0byBjb252ZXJ0XG4gKiBAcmV0dXJuIHtVaW50OEFycmF5fSBCeXRlIHNlcXVlbmNlIGVuY29kZWQgYnkgVVRGLThcbiAqL1xudmFyIHN0cmluZ1RvVXRmOEJ5dGVzID0gZnVuY3Rpb24gKHN0cikge1xuXG4gICAgLy8gTWF4IHNpemUgb2YgMSBjaGFyYWN0ZXIgaXMgNCBieXRlc1xuICAgIHZhciBieXRlcyA9IG5ldyBVaW50OEFycmF5KHN0ci5sZW5ndGggKiA0KTtcblxuICAgIHZhciBpID0gMCwgaiA9IDA7XG5cbiAgICB3aGlsZSAoaSA8IHN0ci5sZW5ndGgpIHtcbiAgICAgICAgdmFyIHVuaWNvZGVfY29kZTtcblxuICAgICAgICB2YXIgdXRmMTZfY29kZSA9IHN0ci5jaGFyQ29kZUF0KGkrKyk7XG4gICAgICAgIGlmICh1dGYxNl9jb2RlID49IDB4RDgwMCAmJiB1dGYxNl9jb2RlIDw9IDB4REJGRikge1xuICAgICAgICAgICAgLy8gc3Vycm9nYXRlIHBhaXJcbiAgICAgICAgICAgIHZhciB1cHBlciA9IHV0ZjE2X2NvZGU7ICAgICAgICAgICAvLyBoaWdoIHN1cnJvZ2F0ZVxuICAgICAgICAgICAgdmFyIGxvd2VyID0gc3RyLmNoYXJDb2RlQXQoaSsrKTsgIC8vIGxvdyBzdXJyb2dhdGVcblxuICAgICAgICAgICAgaWYgKGxvd2VyID49IDB4REMwMCAmJiBsb3dlciA8PSAweERGRkYpIHtcbiAgICAgICAgICAgICAgICB1bmljb2RlX2NvZGUgPVxuICAgICAgICAgICAgICAgICAgICAodXBwZXIgLSAweEQ4MDApICogKDEgPDwgMTApICsgKDEgPDwgMTYpICtcbiAgICAgICAgICAgICAgICAgICAgKGxvd2VyIC0gMHhEQzAwKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gbWFsZm9ybWVkIHN1cnJvZ2F0ZSBwYWlyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBub3Qgc3Vycm9nYXRlIGNvZGVcbiAgICAgICAgICAgIHVuaWNvZGVfY29kZSA9IHV0ZjE2X2NvZGU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodW5pY29kZV9jb2RlIDwgMHg4MCkge1xuICAgICAgICAgICAgLy8gMS1ieXRlXG4gICAgICAgICAgICBieXRlc1tqKytdID0gdW5pY29kZV9jb2RlO1xuXG4gICAgICAgIH0gZWxzZSBpZiAodW5pY29kZV9jb2RlIDwgKDEgPDwgMTEpKSB7XG4gICAgICAgICAgICAvLyAyLWJ5dGVcbiAgICAgICAgICAgIGJ5dGVzW2orK10gPSAodW5pY29kZV9jb2RlID4+PiA2KSB8IDB4QzA7XG4gICAgICAgICAgICBieXRlc1tqKytdID0gKHVuaWNvZGVfY29kZSAmIDB4M0YpIHwgMHg4MDtcblxuICAgICAgICB9IGVsc2UgaWYgKHVuaWNvZGVfY29kZSA8ICgxIDw8IDE2KSkge1xuICAgICAgICAgICAgLy8gMy1ieXRlXG4gICAgICAgICAgICBieXRlc1tqKytdID0gKHVuaWNvZGVfY29kZSA+Pj4gMTIpIHwgMHhFMDtcbiAgICAgICAgICAgIGJ5dGVzW2orK10gPSAoKHVuaWNvZGVfY29kZSA+PiA2KSAmIDB4M2YpIHwgMHg4MDtcbiAgICAgICAgICAgIGJ5dGVzW2orK10gPSAodW5pY29kZV9jb2RlICYgMHgzRikgfCAweDgwO1xuXG4gICAgICAgIH0gZWxzZSBpZiAodW5pY29kZV9jb2RlIDwgKDEgPDwgMjEpKSB7XG4gICAgICAgICAgICAvLyA0LWJ5dGVcbiAgICAgICAgICAgIGJ5dGVzW2orK10gPSAodW5pY29kZV9jb2RlID4+PiAxOCkgfCAweEYwO1xuICAgICAgICAgICAgYnl0ZXNbaisrXSA9ICgodW5pY29kZV9jb2RlID4+IDEyKSAmIDB4M0YpIHwgMHg4MDtcbiAgICAgICAgICAgIGJ5dGVzW2orK10gPSAoKHVuaWNvZGVfY29kZSA+PiA2KSAmIDB4M0YpIHwgMHg4MDtcbiAgICAgICAgICAgIGJ5dGVzW2orK10gPSAodW5pY29kZV9jb2RlICYgMHgzRikgfCAweDgwO1xuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBtYWxmb3JtZWQgVUNTNCBjb2RlXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYnl0ZXMuc3ViYXJyYXkoMCwgaik7XG59O1xuXG5cbi8qKlxuICogQ29udmVydCBVVEYtOCBBcnJheUJ1ZmZlciB0byBTdHJpbmcgKFVURi0xNilcbiAqXG4gKiBAcGFyYW0ge0FycmF5fSBieXRlcyBVVEYtOCBieXRlIHNlcXVlbmNlIHRvIGNvbnZlcnRcbiAqIEByZXR1cm4ge1N0cmluZ30gU3RyaW5nIGVuY29kZWQgYnkgVVRGLTE2XG4gKi9cbnZhciB1dGY4Qnl0ZXNUb1N0cmluZyA9IGZ1bmN0aW9uIChieXRlcykge1xuXG4gICAgdmFyIHN0ciA9IFwiXCI7XG4gICAgdmFyIGNvZGUsIGIxLCBiMiwgYjMsIGI0LCB1cHBlciwgbG93ZXI7XG4gICAgdmFyIGkgPSAwO1xuXG4gICAgd2hpbGUgKGkgPCBieXRlcy5sZW5ndGgpIHtcblxuICAgICAgICBiMSA9IGJ5dGVzW2krK107XG5cbiAgICAgICAgaWYgKGIxIDwgMHg4MCkge1xuICAgICAgICAgICAgLy8gMSBieXRlXG4gICAgICAgICAgICBjb2RlID0gYjE7XG4gICAgICAgIH0gZWxzZSBpZiAoKGIxID4+IDUpID09PSAweDA2KSB7XG4gICAgICAgICAgICAvLyAyIGJ5dGVzXG4gICAgICAgICAgICBiMiA9IGJ5dGVzW2krK107XG4gICAgICAgICAgICBjb2RlID0gKChiMSAmIDB4MWYpIDw8IDYpIHwgKGIyICYgMHgzZik7XG4gICAgICAgIH0gZWxzZSBpZiAoKGIxID4+IDQpID09PSAweDBlKSB7XG4gICAgICAgICAgICAvLyAzIGJ5dGVzXG4gICAgICAgICAgICBiMiA9IGJ5dGVzW2krK107XG4gICAgICAgICAgICBiMyA9IGJ5dGVzW2krK107XG4gICAgICAgICAgICBjb2RlID0gKChiMSAmIDB4MGYpIDw8IDEyKSB8ICgoYjIgJiAweDNmKSA8PCA2KSB8IChiMyAmIDB4M2YpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gNCBieXRlc1xuICAgICAgICAgICAgYjIgPSBieXRlc1tpKytdO1xuICAgICAgICAgICAgYjMgPSBieXRlc1tpKytdO1xuICAgICAgICAgICAgYjQgPSBieXRlc1tpKytdO1xuICAgICAgICAgICAgY29kZSA9ICgoYjEgJiAweDA3KSA8PCAxOCkgfCAoKGIyICYgMHgzZikgPDwgMTIpIHwgKChiMyAmIDB4M2YpIDw8IDYpIHwgKGI0ICYgMHgzZik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29kZSA8IDB4MTAwMDApIHtcbiAgICAgICAgICAgIHN0ciArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gc3Vycm9nYXRlIHBhaXJcbiAgICAgICAgICAgIGNvZGUgLT0gMHgxMDAwMDtcbiAgICAgICAgICAgIHVwcGVyID0gKDB4RDgwMCB8IChjb2RlID4+IDEwKSk7XG4gICAgICAgICAgICBsb3dlciA9ICgweERDMDAgfCAoY29kZSAmIDB4M0ZGKSk7XG4gICAgICAgICAgICBzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSh1cHBlciwgbG93ZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cjtcbn07XG5cblxuLyoqXG4gKiBVdGlsaXRpZXMgdG8gbWFuaXB1bGF0ZSBieXRlIHNlcXVlbmNlXG4gKiBAcGFyYW0geyhudW1iZXJ8VWludDhBcnJheSl9IGFyZyBJbml0aWFsIHNpemUgb2YgdGhpcyBidWZmZXIgKG51bWJlciksIG9yIGJ1ZmZlciB0byBzZXQgKFVpbnQ4QXJyYXkpXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gQnl0ZUJ1ZmZlcihhcmcpIHtcbiAgICB2YXIgaW5pdGlhbF9zaXplO1xuICAgIGlmIChhcmcgPT0gbnVsbCkge1xuICAgICAgICBpbml0aWFsX3NpemUgPSAxMDI0ICogMTAyNDtcbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgaW5pdGlhbF9zaXplID0gYXJnO1xuICAgIH0gZWxzZSBpZiAoYXJnIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgICAgICB0aGlzLmJ1ZmZlciA9IGFyZztcbiAgICAgICAgdGhpcy5wb3NpdGlvbiA9IDA7ICAvLyBPdmVyd3JpdGVcbiAgICAgICAgcmV0dXJuO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHR5cGVvZiBhcmcgLT4gU3RyaW5nXG4gICAgICAgIHRocm93IHR5cGVvZiBhcmcgKyBcIiBpcyBpbnZhbGlkIHBhcmFtZXRlciB0eXBlIGZvciBCeXRlQnVmZmVyIGNvbnN0cnVjdG9yXCI7XG4gICAgfVxuICAgIC8vIGFyZyBpcyBudWxsIG9yIG51bWJlclxuICAgIHRoaXMuYnVmZmVyID0gbmV3IFVpbnQ4QXJyYXkoaW5pdGlhbF9zaXplKTtcbiAgICB0aGlzLnBvc2l0aW9uID0gMDtcbn1cblxuQnl0ZUJ1ZmZlci5wcm90b3R5cGUuc2l6ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gdGhpcy5idWZmZXIubGVuZ3RoO1xufTtcblxuQnl0ZUJ1ZmZlci5wcm90b3R5cGUucmVhbGxvY2F0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbmV3X2FycmF5ID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5idWZmZXIubGVuZ3RoICogMik7XG4gICAgbmV3X2FycmF5LnNldCh0aGlzLmJ1ZmZlcik7XG4gICAgdGhpcy5idWZmZXIgPSBuZXdfYXJyYXk7XG59O1xuXG5CeXRlQnVmZmVyLnByb3RvdHlwZS5zaHJpbmsgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5idWZmZXIgPSB0aGlzLmJ1ZmZlci5zdWJhcnJheSgwLCB0aGlzLnBvc2l0aW9uKTtcbiAgICByZXR1cm4gdGhpcy5idWZmZXI7XG59O1xuXG5CeXRlQnVmZmVyLnByb3RvdHlwZS5wdXQgPSBmdW5jdGlvbiAoYikge1xuICAgIGlmICh0aGlzLmJ1ZmZlci5sZW5ndGggPCB0aGlzLnBvc2l0aW9uICsgMSkge1xuICAgICAgICB0aGlzLnJlYWxsb2NhdGUoKTtcbiAgICB9XG4gICAgdGhpcy5idWZmZXJbdGhpcy5wb3NpdGlvbisrXSA9IGI7XG59O1xuXG5CeXRlQnVmZmVyLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICBpZiAoaW5kZXggPT0gbnVsbCkge1xuICAgICAgICBpbmRleCA9IHRoaXMucG9zaXRpb247XG4gICAgICAgIHRoaXMucG9zaXRpb24gKz0gMTtcbiAgICB9XG4gICAgaWYgKHRoaXMuYnVmZmVyLmxlbmd0aCA8IGluZGV4ICsgMSkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYnVmZmVyW2luZGV4XTtcbn07XG5cbi8vIFdyaXRlIHNob3J0IHRvIGJ1ZmZlciBieSBsaXR0bGUgZW5kaWFuXG5CeXRlQnVmZmVyLnByb3RvdHlwZS5wdXRTaG9ydCA9IGZ1bmN0aW9uIChudW0pIHtcbiAgICBpZiAoMHhGRkZGIDwgbnVtKSB7XG4gICAgICAgIHRocm93IG51bSArIFwiIGlzIG92ZXIgc2hvcnQgdmFsdWVcIjtcbiAgICB9XG4gICAgdmFyIGxvd2VyID0gKDB4MDBGRiAmIG51bSk7XG4gICAgdmFyIHVwcGVyID0gKDB4RkYwMCAmIG51bSkgPj4gODtcbiAgICB0aGlzLnB1dChsb3dlcik7XG4gICAgdGhpcy5wdXQodXBwZXIpO1xufTtcblxuLy8gUmVhZCBzaG9ydCBmcm9tIGJ1ZmZlciBieSBsaXR0bGUgZW5kaWFuXG5CeXRlQnVmZmVyLnByb3RvdHlwZS5nZXRTaG9ydCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICAgIGluZGV4ID0gdGhpcy5wb3NpdGlvbjtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiArPSAyO1xuICAgIH1cbiAgICBpZiAodGhpcy5idWZmZXIubGVuZ3RoIDwgaW5kZXggKyAyKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICB2YXIgbG93ZXIgPSB0aGlzLmJ1ZmZlcltpbmRleF07XG4gICAgdmFyIHVwcGVyID0gdGhpcy5idWZmZXJbaW5kZXggKyAxXTtcbiAgICByZXR1cm4gKHVwcGVyIDw8IDgpICsgbG93ZXI7XG59O1xuXG4vLyBXcml0ZSBpbnRlZ2VyIHRvIGJ1ZmZlciBieSBsaXR0bGUgZW5kaWFuXG5CeXRlQnVmZmVyLnByb3RvdHlwZS5wdXRJbnQgPSBmdW5jdGlvbiAobnVtKSB7XG4gICAgaWYgKDB4RkZGRkZGRkYgPCBudW0pIHtcbiAgICAgICAgdGhyb3cgbnVtICsgXCIgaXMgb3ZlciBpbnRlZ2VyIHZhbHVlXCI7XG4gICAgfVxuICAgIHZhciBiMCA9ICgweDAwMDAwMEZGICYgbnVtKTtcbiAgICB2YXIgYjEgPSAoMHgwMDAwRkYwMCAmIG51bSkgPj4gODtcbiAgICB2YXIgYjIgPSAoMHgwMEZGMDAwMCAmIG51bSkgPj4gMTY7XG4gICAgdmFyIGIzID0gKDB4RkYwMDAwMDAgJiBudW0pID4+IDI0O1xuICAgIHRoaXMucHV0KGIwKTtcbiAgICB0aGlzLnB1dChiMSk7XG4gICAgdGhpcy5wdXQoYjIpO1xuICAgIHRoaXMucHV0KGIzKTtcbn07XG5cbi8vIFJlYWQgaW50ZWdlciBmcm9tIGJ1ZmZlciBieSBsaXR0bGUgZW5kaWFuXG5CeXRlQnVmZmVyLnByb3RvdHlwZS5nZXRJbnQgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICBpZiAoaW5kZXggPT0gbnVsbCkge1xuICAgICAgICBpbmRleCA9IHRoaXMucG9zaXRpb247XG4gICAgICAgIHRoaXMucG9zaXRpb24gKz0gNDtcbiAgICB9XG4gICAgaWYgKHRoaXMuYnVmZmVyLmxlbmd0aCA8IGluZGV4ICsgNCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgdmFyIGIwID0gdGhpcy5idWZmZXJbaW5kZXhdO1xuICAgIHZhciBiMSA9IHRoaXMuYnVmZmVyW2luZGV4ICsgMV07XG4gICAgdmFyIGIyID0gdGhpcy5idWZmZXJbaW5kZXggKyAyXTtcbiAgICB2YXIgYjMgPSB0aGlzLmJ1ZmZlcltpbmRleCArIDNdO1xuXG4gICAgcmV0dXJuIChiMyA8PCAyNCkgKyAoYjIgPDwgMTYpICsgKGIxIDw8IDgpICsgYjA7XG59O1xuXG5CeXRlQnVmZmVyLnByb3RvdHlwZS5yZWFkSW50ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBwb3MgPSB0aGlzLnBvc2l0aW9uO1xuICAgIHRoaXMucG9zaXRpb24gKz0gNDtcbiAgICByZXR1cm4gdGhpcy5nZXRJbnQocG9zKTtcbn07XG5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLnB1dFN0cmluZyA9IGZ1bmN0aW9uIChzdHIpIHtcbiAgICB2YXIgYnl0ZXMgPSBzdHJpbmdUb1V0ZjhCeXRlcyhzdHIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGhpcy5wdXQoYnl0ZXNbaV0pO1xuICAgIH1cbiAgICAvLyBwdXQgbnVsbCBjaGFyYWN0ZXIgYXMgdGVybWluYWwgY2hhcmFjdGVyXG4gICAgdGhpcy5wdXQoMCk7XG59O1xuXG5CeXRlQnVmZmVyLnByb3RvdHlwZS5nZXRTdHJpbmcgPSBmdW5jdGlvbiAoaW5kZXgpIHtcbiAgICB2YXIgYnVmID0gW10sXG4gICAgICAgIGNoO1xuICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICAgIGluZGV4ID0gdGhpcy5wb3NpdGlvbjtcbiAgICB9XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgaWYgKHRoaXMuYnVmZmVyLmxlbmd0aCA8IGluZGV4ICsgMSkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2ggPSB0aGlzLmdldChpbmRleCsrKTtcbiAgICAgICAgaWYgKGNoID09PSAwKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGJ1Zi5wdXNoKGNoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnBvc2l0aW9uID0gaW5kZXg7XG4gICAgcmV0dXJuIHV0ZjhCeXRlc1RvU3RyaW5nKGJ1Zik7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQnl0ZUJ1ZmZlcjtcbiJdLCJmaWxlIjoidXRpbC9CeXRlQnVmZmVyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=