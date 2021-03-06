import { BinaryReader } from './utils.js';
import { TCPSegment } from './tcp.js';
import { UDPSegment } from './udp.js';
import { ICMPSegment } from './icmp.js';

export const SegmentTypes = {
  1: ICMPSegment,
  6: TCPSegment,
  17: UDPSegment,
};

export class IPv4Datagram extends BinaryReader {
  constructor(data, offset) {
    super(data, offset);
//hexdump(this._data, 'IPv4 datagram');
    this.parse({
      versionAndLength: 'Uint8',
      DSCPECN: 'Uint8',
      length: 'Uint16',
      id: 'Uint16',
      flagsFragoffset: 'Uint16',
      ttl: 'Uint8',
      proto: 'Uint8',
      checksum: 'Uint16',
      srcAddrBytes: 'Uint8[4]',
      dstAddrBytes: 'Uint8[4]',
      //options:  'Uint32',
    });
    this.version = this.versionAndLength >> 4;
    this.headerWordCount = this.versionAndLength & 0x0f;

    this.srcAddr = this.parseIPAddress(this.srcAddrBytes);
    this.dstAddr = this.parseIPAddress(this.dstAddrBytes);

//console.log('IP packet', this, this.length, this.headerWordCount * 4, this._data.length);
    this.headerLength = this.headerWordCount * 4;
    if (SegmentTypes[this.proto]) {
      let payload = false;
      try {
        payload = this.readArray('Uint8', this.headerLength, Math.min(this._data.byteLength, this.length) - this.headerLength);
        this.segment = new SegmentTypes[this.proto](payload);
      } catch (e) {
        console.warn('Failed to parse segment', this.proto, payload, this, e);
      }
    } else {
      console.warn('Unknown segment type in datagram', this.proto, this);
    }
  }
  parseIPAddress(bytes) {
    return bytes.join('.');
  }
};

