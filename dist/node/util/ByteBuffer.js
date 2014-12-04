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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC9CeXRlQnVmZmVyLmpzIiwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXMiOlsidXRpbC9CeXRlQnVmZmVyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgQ29weXJpZ2h0IDIwMTQgVGFrdXlhIEFzYW5vXG4gKiBDb3B5cmlnaHQgMjAxMC0yMDE0IEF0aWxpa2EgSW5jLiBhbmQgY29udHJpYnV0b3JzXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIENvbnZlcnQgU3RyaW5nIChVVEYtMTYpIHRvIFVURi04IEFycmF5QnVmZmVyXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHN0ciBVVEYtMTYgc3RyaW5nIHRvIGNvbnZlcnRcbiAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9IEJ5dGUgc2VxdWVuY2UgZW5jb2RlZCBieSBVVEYtOFxuICovXG52YXIgc3RyaW5nVG9VdGY4Qnl0ZXMgPSBmdW5jdGlvbiAoc3RyKSB7XG5cbiAgICAvLyBNYXggc2l6ZSBvZiAxIGNoYXJhY3RlciBpcyA0IGJ5dGVzXG4gICAgdmFyIGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoc3RyLmxlbmd0aCAqIDQpO1xuXG4gICAgdmFyIGkgPSAwLCBqID0gMDtcblxuICAgIHdoaWxlIChpIDwgc3RyLmxlbmd0aCkge1xuICAgICAgICB2YXIgdW5pY29kZV9jb2RlO1xuXG4gICAgICAgIHZhciB1dGYxNl9jb2RlID0gc3RyLmNoYXJDb2RlQXQoaSsrKTtcbiAgICAgICAgaWYgKHV0ZjE2X2NvZGUgPj0gMHhEODAwICYmIHV0ZjE2X2NvZGUgPD0gMHhEQkZGKSB7XG4gICAgICAgICAgICAvLyBzdXJyb2dhdGUgcGFpclxuICAgICAgICAgICAgdmFyIHVwcGVyID0gdXRmMTZfY29kZTsgICAgICAgICAgIC8vIGhpZ2ggc3Vycm9nYXRlXG4gICAgICAgICAgICB2YXIgbG93ZXIgPSBzdHIuY2hhckNvZGVBdChpKyspOyAgLy8gbG93IHN1cnJvZ2F0ZVxuXG4gICAgICAgICAgICBpZiAobG93ZXIgPj0gMHhEQzAwICYmIGxvd2VyIDw9IDB4REZGRikge1xuICAgICAgICAgICAgICAgIHVuaWNvZGVfY29kZSA9XG4gICAgICAgICAgICAgICAgICAgICh1cHBlciAtIDB4RDgwMCkgKiAoMSA8PCAxMCkgKyAoMSA8PCAxNikgK1xuICAgICAgICAgICAgICAgICAgICAobG93ZXIgLSAweERDMDApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBtYWxmb3JtZWQgc3Vycm9nYXRlIHBhaXJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIG5vdCBzdXJyb2dhdGUgY29kZVxuICAgICAgICAgICAgdW5pY29kZV9jb2RlID0gdXRmMTZfY29kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1bmljb2RlX2NvZGUgPCAweDgwKSB7XG4gICAgICAgICAgICAvLyAxLWJ5dGVcbiAgICAgICAgICAgIGJ5dGVzW2orK10gPSB1bmljb2RlX2NvZGU7XG5cbiAgICAgICAgfSBlbHNlIGlmICh1bmljb2RlX2NvZGUgPCAoMSA8PCAxMSkpIHtcbiAgICAgICAgICAgIC8vIDItYnl0ZVxuICAgICAgICAgICAgYnl0ZXNbaisrXSA9ICh1bmljb2RlX2NvZGUgPj4+IDYpIHwgMHhDMDtcbiAgICAgICAgICAgIGJ5dGVzW2orK10gPSAodW5pY29kZV9jb2RlICYgMHgzRikgfCAweDgwO1xuXG4gICAgICAgIH0gZWxzZSBpZiAodW5pY29kZV9jb2RlIDwgKDEgPDwgMTYpKSB7XG4gICAgICAgICAgICAvLyAzLWJ5dGVcbiAgICAgICAgICAgIGJ5dGVzW2orK10gPSAodW5pY29kZV9jb2RlID4+PiAxMikgfCAweEUwO1xuICAgICAgICAgICAgYnl0ZXNbaisrXSA9ICgodW5pY29kZV9jb2RlID4+IDYpICYgMHgzZikgfCAweDgwO1xuICAgICAgICAgICAgYnl0ZXNbaisrXSA9ICh1bmljb2RlX2NvZGUgJiAweDNGKSB8IDB4ODA7XG5cbiAgICAgICAgfSBlbHNlIGlmICh1bmljb2RlX2NvZGUgPCAoMSA8PCAyMSkpIHtcbiAgICAgICAgICAgIC8vIDQtYnl0ZVxuICAgICAgICAgICAgYnl0ZXNbaisrXSA9ICh1bmljb2RlX2NvZGUgPj4+IDE4KSB8IDB4RjA7XG4gICAgICAgICAgICBieXRlc1tqKytdID0gKCh1bmljb2RlX2NvZGUgPj4gMTIpICYgMHgzRikgfCAweDgwO1xuICAgICAgICAgICAgYnl0ZXNbaisrXSA9ICgodW5pY29kZV9jb2RlID4+IDYpICYgMHgzRikgfCAweDgwO1xuICAgICAgICAgICAgYnl0ZXNbaisrXSA9ICh1bmljb2RlX2NvZGUgJiAweDNGKSB8IDB4ODA7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIG1hbGZvcm1lZCBVQ1M0IGNvZGVcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBieXRlcy5zdWJhcnJheSgwLCBqKTtcbn07XG5cblxuLyoqXG4gKiBDb252ZXJ0IFVURi04IEFycmF5QnVmZmVyIHRvIFN0cmluZyAoVVRGLTE2KVxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IGJ5dGVzIFVURi04IGJ5dGUgc2VxdWVuY2UgdG8gY29udmVydFxuICogQHJldHVybiB7U3RyaW5nfSBTdHJpbmcgZW5jb2RlZCBieSBVVEYtMTZcbiAqL1xudmFyIHV0ZjhCeXRlc1RvU3RyaW5nID0gZnVuY3Rpb24gKGJ5dGVzKSB7XG5cbiAgICB2YXIgc3RyID0gXCJcIjtcbiAgICB2YXIgY29kZSwgYjEsIGIyLCBiMywgYjQsIHVwcGVyLCBsb3dlcjtcbiAgICB2YXIgaSA9IDA7XG5cbiAgICB3aGlsZSAoaSA8IGJ5dGVzLmxlbmd0aCkge1xuXG4gICAgICAgIGIxID0gYnl0ZXNbaSsrXTtcblxuICAgICAgICBpZiAoYjEgPCAweDgwKSB7XG4gICAgICAgICAgICAvLyAxIGJ5dGVcbiAgICAgICAgICAgIGNvZGUgPSBiMTtcbiAgICAgICAgfSBlbHNlIGlmICgoYjEgPj4gNSkgPT09IDB4MDYpIHtcbiAgICAgICAgICAgIC8vIDIgYnl0ZXNcbiAgICAgICAgICAgIGIyID0gYnl0ZXNbaSsrXTtcbiAgICAgICAgICAgIGNvZGUgPSAoKGIxICYgMHgxZikgPDwgNikgfCAoYjIgJiAweDNmKTtcbiAgICAgICAgfSBlbHNlIGlmICgoYjEgPj4gNCkgPT09IDB4MGUpIHtcbiAgICAgICAgICAgIC8vIDMgYnl0ZXNcbiAgICAgICAgICAgIGIyID0gYnl0ZXNbaSsrXTtcbiAgICAgICAgICAgIGIzID0gYnl0ZXNbaSsrXTtcbiAgICAgICAgICAgIGNvZGUgPSAoKGIxICYgMHgwZikgPDwgMTIpIHwgKChiMiAmIDB4M2YpIDw8IDYpIHwgKGIzICYgMHgzZik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyA0IGJ5dGVzXG4gICAgICAgICAgICBiMiA9IGJ5dGVzW2krK107XG4gICAgICAgICAgICBiMyA9IGJ5dGVzW2krK107XG4gICAgICAgICAgICBiNCA9IGJ5dGVzW2krK107XG4gICAgICAgICAgICBjb2RlID0gKChiMSAmIDB4MDcpIDw8IDE4KSB8ICgoYjIgJiAweDNmKSA8PCAxMikgfCAoKGIzICYgMHgzZikgPDwgNikgfCAoYjQgJiAweDNmKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb2RlIDwgMHgxMDAwMCkge1xuICAgICAgICAgICAgc3RyICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBzdXJyb2dhdGUgcGFpclxuICAgICAgICAgICAgY29kZSAtPSAweDEwMDAwO1xuICAgICAgICAgICAgdXBwZXIgPSAoMHhEODAwIHwgKGNvZGUgPj4gMTApKTtcbiAgICAgICAgICAgIGxvd2VyID0gKDB4REMwMCB8IChjb2RlICYgMHgzRkYpKTtcbiAgICAgICAgICAgIHN0ciArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHVwcGVyLCBsb3dlcik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc3RyO1xufTtcblxuXG4vKipcbiAqIFV0aWxpdGllcyB0byBtYW5pcHVsYXRlIGJ5dGUgc2VxdWVuY2VcbiAqIEBwYXJhbSB7KG51bWJlcnxVaW50OEFycmF5KX0gYXJnIEluaXRpYWwgc2l6ZSBvZiB0aGlzIGJ1ZmZlciAobnVtYmVyKSwgb3IgYnVmZmVyIHRvIHNldCAoVWludDhBcnJheSlcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBCeXRlQnVmZmVyKGFyZykge1xuICAgIHZhciBpbml0aWFsX3NpemU7XG4gICAgaWYgKGFyZyA9PSBudWxsKSB7XG4gICAgICAgIGluaXRpYWxfc2l6ZSA9IDEwMjQgKiAxMDI0O1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICBpbml0aWFsX3NpemUgPSBhcmc7XG4gICAgfSBlbHNlIGlmIChhcmcgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XG4gICAgICAgIHRoaXMuYnVmZmVyID0gYXJnO1xuICAgICAgICB0aGlzLnBvc2l0aW9uID0gMDsgIC8vIE92ZXJ3cml0ZVxuICAgICAgICByZXR1cm47XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gdHlwZW9mIGFyZyAtPiBTdHJpbmdcbiAgICAgICAgdGhyb3cgdHlwZW9mIGFyZyArIFwiIGlzIGludmFsaWQgcGFyYW1ldGVyIHR5cGUgZm9yIEJ5dGVCdWZmZXIgY29uc3RydWN0b3JcIjtcbiAgICB9XG4gICAgLy8gYXJnIGlzIG51bGwgb3IgbnVtYmVyXG4gICAgdGhpcy5idWZmZXIgPSBuZXcgVWludDhBcnJheShpbml0aWFsX3NpemUpO1xuICAgIHRoaXMucG9zaXRpb24gPSAwO1xufVxuXG5CeXRlQnVmZmVyLnByb3RvdHlwZS5zaXplID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLmJ1ZmZlci5sZW5ndGg7XG59O1xuXG5CeXRlQnVmZmVyLnByb3RvdHlwZS5yZWFsbG9jYXRlID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBuZXdfYXJyYXkgPSBuZXcgVWludDhBcnJheSh0aGlzLmJ1ZmZlci5sZW5ndGggKiAyKTtcbiAgICBuZXdfYXJyYXkuc2V0KHRoaXMuYnVmZmVyKTtcbiAgICB0aGlzLmJ1ZmZlciA9IG5ld19hcnJheTtcbn07XG5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLnNocmluayA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmJ1ZmZlciA9IHRoaXMuYnVmZmVyLnN1YmFycmF5KDAsIHRoaXMucG9zaXRpb24pO1xuICAgIHJldHVybiB0aGlzLmJ1ZmZlcjtcbn07XG5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLnB1dCA9IGZ1bmN0aW9uIChiKSB7XG4gICAgaWYgKHRoaXMuYnVmZmVyLmxlbmd0aCA8IHRoaXMucG9zaXRpb24gKyAxKSB7XG4gICAgICAgIHRoaXMucmVhbGxvY2F0ZSgpO1xuICAgIH1cbiAgICB0aGlzLmJ1ZmZlclt0aGlzLnBvc2l0aW9uKytdID0gYjtcbn07XG5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICAgIGluZGV4ID0gdGhpcy5wb3NpdGlvbjtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiArPSAxO1xuICAgIH1cbiAgICBpZiAodGhpcy5idWZmZXIubGVuZ3RoIDwgaW5kZXggKyAxKSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5idWZmZXJbaW5kZXhdO1xufTtcblxuLy8gV3JpdGUgc2hvcnQgdG8gYnVmZmVyIGJ5IGxpdHRsZSBlbmRpYW5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLnB1dFNob3J0ID0gZnVuY3Rpb24gKG51bSkge1xuICAgIGlmICgweEZGRkYgPCBudW0pIHtcbiAgICAgICAgdGhyb3cgbnVtICsgXCIgaXMgb3ZlciBzaG9ydCB2YWx1ZVwiO1xuICAgIH1cbiAgICB2YXIgbG93ZXIgPSAoMHgwMEZGICYgbnVtKTtcbiAgICB2YXIgdXBwZXIgPSAoMHhGRjAwICYgbnVtKSA+PiA4O1xuICAgIHRoaXMucHV0KGxvd2VyKTtcbiAgICB0aGlzLnB1dCh1cHBlcik7XG59O1xuXG4vLyBSZWFkIHNob3J0IGZyb20gYnVmZmVyIGJ5IGxpdHRsZSBlbmRpYW5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLmdldFNob3J0ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgICAgaW5kZXggPSB0aGlzLnBvc2l0aW9uO1xuICAgICAgICB0aGlzLnBvc2l0aW9uICs9IDI7XG4gICAgfVxuICAgIGlmICh0aGlzLmJ1ZmZlci5sZW5ndGggPCBpbmRleCArIDIpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIHZhciBsb3dlciA9IHRoaXMuYnVmZmVyW2luZGV4XTtcbiAgICB2YXIgdXBwZXIgPSB0aGlzLmJ1ZmZlcltpbmRleCArIDFdO1xuICAgIHJldHVybiAodXBwZXIgPDwgOCkgKyBsb3dlcjtcbn07XG5cbi8vIFdyaXRlIGludGVnZXIgdG8gYnVmZmVyIGJ5IGxpdHRsZSBlbmRpYW5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLnB1dEludCA9IGZ1bmN0aW9uIChudW0pIHtcbiAgICBpZiAoMHhGRkZGRkZGRiA8IG51bSkge1xuICAgICAgICB0aHJvdyBudW0gKyBcIiBpcyBvdmVyIGludGVnZXIgdmFsdWVcIjtcbiAgICB9XG4gICAgdmFyIGIwID0gKDB4MDAwMDAwRkYgJiBudW0pO1xuICAgIHZhciBiMSA9ICgweDAwMDBGRjAwICYgbnVtKSA+PiA4O1xuICAgIHZhciBiMiA9ICgweDAwRkYwMDAwICYgbnVtKSA+PiAxNjtcbiAgICB2YXIgYjMgPSAoMHhGRjAwMDAwMCAmIG51bSkgPj4gMjQ7XG4gICAgdGhpcy5wdXQoYjApO1xuICAgIHRoaXMucHV0KGIxKTtcbiAgICB0aGlzLnB1dChiMik7XG4gICAgdGhpcy5wdXQoYjMpO1xufTtcblxuLy8gUmVhZCBpbnRlZ2VyIGZyb20gYnVmZmVyIGJ5IGxpdHRsZSBlbmRpYW5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLmdldEludCA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICAgIGluZGV4ID0gdGhpcy5wb3NpdGlvbjtcbiAgICAgICAgdGhpcy5wb3NpdGlvbiArPSA0O1xuICAgIH1cbiAgICBpZiAodGhpcy5idWZmZXIubGVuZ3RoIDwgaW5kZXggKyA0KSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICB2YXIgYjAgPSB0aGlzLmJ1ZmZlcltpbmRleF07XG4gICAgdmFyIGIxID0gdGhpcy5idWZmZXJbaW5kZXggKyAxXTtcbiAgICB2YXIgYjIgPSB0aGlzLmJ1ZmZlcltpbmRleCArIDJdO1xuICAgIHZhciBiMyA9IHRoaXMuYnVmZmVyW2luZGV4ICsgM107XG5cbiAgICByZXR1cm4gKGIzIDw8IDI0KSArIChiMiA8PCAxNikgKyAoYjEgPDwgOCkgKyBiMDtcbn07XG5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLnJlYWRJbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHBvcyA9IHRoaXMucG9zaXRpb247XG4gICAgdGhpcy5wb3NpdGlvbiArPSA0O1xuICAgIHJldHVybiB0aGlzLmdldEludChwb3MpO1xufTtcblxuQnl0ZUJ1ZmZlci5wcm90b3R5cGUucHV0U3RyaW5nID0gZnVuY3Rpb24gKHN0cikge1xuICAgIHZhciBieXRlcyA9IHN0cmluZ1RvVXRmOEJ5dGVzKHN0cik7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBieXRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLnB1dChieXRlc1tpXSk7XG4gICAgfVxuICAgIC8vIHB1dCBudWxsIGNoYXJhY3RlciBhcyB0ZXJtaW5hbCBjaGFyYWN0ZXJcbiAgICB0aGlzLnB1dCgwKTtcbn07XG5cbkJ5dGVCdWZmZXIucHJvdG90eXBlLmdldFN0cmluZyA9IGZ1bmN0aW9uIChpbmRleCkge1xuICAgIHZhciBidWYgPSBbXSxcbiAgICAgICAgY2g7XG4gICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgICAgaW5kZXggPSB0aGlzLnBvc2l0aW9uO1xuICAgIH1cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBpZiAodGhpcy5idWZmZXIubGVuZ3RoIDwgaW5kZXggKyAxKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjaCA9IHRoaXMuZ2V0KGluZGV4KyspO1xuICAgICAgICBpZiAoY2ggPT09IDApIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYnVmLnB1c2goY2gpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRoaXMucG9zaXRpb24gPSBpbmRleDtcbiAgICByZXR1cm4gdXRmOEJ5dGVzVG9TdHJpbmcoYnVmKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBCeXRlQnVmZmVyO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9