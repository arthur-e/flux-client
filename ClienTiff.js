/**
 * @overview Client side JavaScript library for writing Tiff and GeoTiff files to a byte array
 * @author Reid Sawtell
 * @license MIT
 * @copyright (c) 2015 Reid Sawtell
 *
 *     Permission is hereby granted, free of charge, to any person obtaining a copy
 *     of this software and associated documentation files (the "Software"), to deal
 *     in the Software without restriction, including without limitation the rights
 *     to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *     copies of the Software, and to permit persons to whom the Software is
 *     furnished to do so, subject to the following conditions:
 * 
 *     The above copyright notice and this permission notice shall be included in
 *     all copies or substantial portions of the Software.
 * 
 *     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *     IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *     AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *     LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *     THE SOFTWARE.
 */

/**
 * Clientiff Namespace
 * @namespace
 */
var ClienTiff = {

   /** 
    * @class TiffWriter
    * Creates a Tiff in memory and outputs as a Uint8Array
    * This may be used in conjuction with blob to generate/download tiff files
    * from data already present on the client end without additional server requests
    * 
    * The resulting object contains the minimum header+tags needed to define a baseline tiff image
    * Additional tags must be added manually, see GeoKeyDirectory for adding GeoTiff tags/keys
    */
    TiffWriter: function() {
        var rasters = [];
        
        var header = new ArrayBuffer(8);
        var byteorder = new Uint8Array(header, 0, 2);
        var version = new Uint8Array(header, 2, 2);
        var IFDOffset = new Int32Array(header, 4, 1);

        //TODO Assumes little endian
        byteorder[0] = 'I'.charCodeAt(0);
        byteorder[1] = 'I'.charCodeAt(0);
        version[0] = 42;
        version[1] = 0;
        IFDOffset[0] = 8;

        return {
            /** set a tag for a specified raster
            * 
            * @param {number} rasterId index of the raster for which the tag will be set
            * @param {number} TagId ID number of the tag to be set (see http://www.awaresystems.be/imaging/tiff/tifftags.html)
            * @param {function} DataType one of "byte" "ascii" "short" "long" "rational" "sbyte" "undefine" "sshort" "int" "slong" "srational" "float" "double"
            * @param {Array} Data a number, list of numbers, list of pairs of numbers (rational / srational), or string, as appropriate to the DataType
            *             numbers will be automatically converted to the appropriate type, it is your responsibility that the output makes sense 
            *             (eg: there is no error checking on negative numbers converted into unsigned values, or too large numbers converted into smaller types.)
            */
            SetTag: function (rasterId, TagId, DataType, Data) {
                raster[rasterId].SetTag(TagId, DataType, Data);
            },
            
            /** Add a new raster band, returns false if the raster was invalid
            * 
            * @param {number} Height number of rows in the image
            * @param {number} Width number of columns in the image
            * @param {number} BitsPerSample must be a multiple of 8
            * @param {number} SamplesPerPixel number of bands in the image (eg. RGB is 3, Grayscale is 1)
            * @param {function} DType one of Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array
            * @param {Array} Data flat list of pixel values, where each pixel is a list of samples
            *             the length of the outer list must match Height*Width
            *             (eg. [[255,255,255]] is a 1x1 image with 3 samples per pixel)
            * @param {object} Options allows overriding default values
            *                 currently supported:
            *                 XResolution - [numerator,denominator] pixels per resolution unit in the X-directio. Default: [72,1]
            *                 YResolution - [numerator,denominator] pixels per resolution unit in the Y-directio. Default: [72,1]
            *                 ResolutionUnit - {1: No absolute unit} {2: Inch} {3: Centimeter}. Default: 2
            *                 Tiled - //TODO
            *                 PlanarConfiguration - {1 - chunky} {2 - seperate}. Default: 1 //TODO finish support for 2
            *                 RowsPerStrip - strips act as entrypoints for the reader so the entire file need not be read if only a subset is desired.
            *                               Tiff specification recommends setting this such that each strip is approximately 8Kb in size. Default 2^32-1
            *
            * @returns {Boolean} true if the raster was successfully added                                                           
            */
            AddRaster: function (Height,Width,BitsPerSample,SamplesPerPixel,DType,Data,Options) {
                var ifd = new ClienTiff.TIFFIFD(Height,Width,BitsPerSample,SamplesPerPixel,DType,Data,Options);
                if(ifd) {
                    rasters.push(ifd);
                    return true;
                }
                
                return false;
                
            },
            
            /** Get a specified raster
            * 
            * @param {number} rasterId index of the raster to be specified, returns undefined if no raster at that index
            * @return {TIFFIFD} raster
            */
            GetRaster: function (rasterId) {
                return rasters[rasterId];
            },
            
            /** Generate the binary byte array for this tiff image
            * 
            * This method creates a 'snapshot' of the tiff's current state, further modifications
            * will not be reflected in the array and you must call this function again to get an updated binary
            * 
            * @returns {ArrayBuffer} data
            */
            GetBinary: function () {
                
                //compute total size of file
                var fsize = 8;
                var rsizes = [];
                
                for(var i=0; i<rasters.length; i++) {
                    var rsize = rasters[i].ComputeSize()
                    fsize += rsize;
                    rsizes.push(rsize);
                }
                
                var bdata = new ArrayBuffer(fsize); //allocate the file buffer
                var bview = new Uint8Array(bdata); //create the byte view
                
                var hview = new Uint8Array(header); //create byte view for header
                
                var EOF = 0;
                
                //write out the file header
                for(EOF; EOF<8;EOF++) {
                    bview[EOF] = hview[EOF];
                }
                
                //write each raster to the array
                for(var i=0; i<rasters.length; i++) {
                    EOF = rasters[i].WriteBinary(bview,EOF,i!=rasters.length-1);
                }
                
                return bdata;
            }
        };
    },

   /** 
    * @class TIFFIFD
    * 
    * This class represents a tiff image file directory and the associated image data
    * 
    * @param {number} Height number of rows in the image
    * @param {number} Width number of columns in the image
    * @param {number} BitsPerSample must be a multiple of 8
    * @param {number} SamplesPerPixel number of bands in the image (eg. RGB is 3, Grayscale is 1)
    * @param {function} DType one of Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array
    * @param {Array} Data flat list of pixel values, where each pixel is a list of samples
    *             the length of the outer list must match Height*Width
    *             (eg. [[255,255,255]] is a 1x1 image with 3 samples per pixel)
    * @param {object} Options allows overriding default values
    *                 currently supported:
    *                 XResolution - [numerator,denominator] pixels per resolution unit in the X-directio. Default: [72,1]
    *                 YResolution - [numerator,denominator] pixels per resolution unit in the Y-directio. Default: [72,1]
    *                 ResolutionUnit - {1: No absolute unit} {2: Inch} {3: Centimeter}. Default: 2
    *                 Tiled - //TODO
    *                 PlanarConfiguration - {1 - chunky} {2 - seperate}. Default: 1 //TODO finish support for 2
    *                 RowsPerStrip - strips act as entrypoints for the reader so the entire file need not be read if only a subset is desired.
    *                               Tiff specification recommends setting this such that each strip is approximately 8Kb in size. Default 2^32-1                                                          
    */
    TIFFIFD: function (Height,Width,BitsPerSample,SamplesPerPixel,DType,Data,Options) {
        var tags = {};
        var dsize = 0;
        
        var defaults = {
            XResolution: [72,1],
            YResolution: [72,1],
            ResolutionUnit: 2,
            Tiled: false,
            PlanarConfiguration: 1
        }
        
        //combine defaults with user specified options
        for(var key in defaults) {
            if(Options[key] == undefined || Options[key] == null) {
                Options[key] = defaults[key];
            }
        }
        
        //default to single strip per image
        if(!Options.RowsPerStrip) {
            Options.RowsPerStrip = 4294967295;
        }
        
        //sample sizes must be some multiple of bytes
        if(BitsPerSample != Math.floor(BitsPerSample/8)*8) {
            console.log("Sample sizes other than multiples of 8 are unsupported");
            return null;
        }
        
        //calculate strip sizes
        if(!Options.Tiled) {
            var strips = Math.floor((Height + Options.RowsPerStrip-1)/Options.RowsPerStrip);
            Options.StripByteCounts = [];
            
            var rowsize;
            
            //calculate the number of bytes per row
            if(Options.PlanarConfiguration == 2) {
                rowsize = Width*BitsPerSample/8; 
            }
            else {
                rowsize = Width*SamplesPerPixel*BitsPerSample/8;
                //console.log("rowsize: "+rowsize);
            }
            
            var rowsRemaining = Height;
            
            while(rowsRemaining>0) {
                if(rowsRemaining>=Options.RowsPerStrip) {
                    Options.StripByteCounts.push(Options.RowsPerStrip * rowsize);
                    rowsRemaining -= Options.RowsPerStrip;
                }
                else {
                    Options.StripByteCounts.push(rowsRemaining * rowsize);
                    rowsRemaining = 0;
                }
            }
            
            //repeat the bytecount array if needed
            if(Options.PlanarConfiguration == 2) {
                var base = [];
                for(var i=0;i<SamplesPerPixel;i++) {
                    for(var j=0;j<Options.StripByteCounts.length; j++) {
                        base.push(Options.StripByteCounts[j]);
                    }
                }
                
                Options.StripByteCounts = base;
            }
            
                //size of data
                for(var i=0; i<Options.StripByteCounts.length; i++) {
                    dsize += Options.StripByteCounts[i];
                }
        }
        
        //all sample sizes are assumed the same
        var SBitArray = new Array(SamplesPerPixel);
        
        for(var i=0; i<SamplesPerPixel; i++) {
            SBitArray[i] = BitsPerSample;
        }  
        
        //TODO calculate tile sizes
        
        //Initialize Raster Baseline Tags
        tags[254] = new ClienTiff.TIFFTAG(254, "long", 0); //NewSubfileType
        tags[256] = new ClienTiff.TIFFTAG(256, "long", Width); //ImageWidth
        tags[257] = new ClienTiff.TIFFTAG(257, "long", Height); //ImageHeight
        tags[258] = new ClienTiff.TIFFTAG(258, "short", SBitArray); //BitsPerSample
        tags[259] = new ClienTiff.TIFFTAG(259, "short", 1); //Compression: NoCompression
        tags[262] = new ClienTiff.TIFFTAG(262, "short", 1); //PhotometricInterpretation: BlackIsZero
        tags[277] = new ClienTiff.TIFFTAG(277, "short", SamplesPerPixel); //SamplesPerPixel
        tags[278] = new ClienTiff.TIFFTAG(278, "long", Options.RowsPerStrip);
        tags[279] = new ClienTiff.TIFFTAG(279, "long", Options.StripByteCounts); //StipByteCounts
        tags[273] = new ClienTiff.TIFFTAG(273, "long", Array(Options.StripByteCounts.length)); // StripOffsets (dummy entry so file size is correctly determined)
        tags[282] = new ClienTiff.TIFFTAG(282, "rational", Options.XResolution); //XResolution
        tags[283] = new ClienTiff.TIFFTAG(283, "rational", Options.YResolution); //YResolution
        tags[293] = new ClienTiff.TIFFTAG(293, "short", Options.ResolutionUnit); //ResolutionUnit: RESUNIT_INCH
        
        
        //include planar configuration tag if multi-sampled
        if(SamplesPerPixel>1) {
            tags[284] = new ClienTiff.TIFFTAG(284, "short", Options.PlanarConfiguration);
        }
        
        return {
            /* Set a tag*/
            SetTag: function(TagId, DataType, Data) {
                tags[TagId] = new ClienTiff.TIFFTAG(TagId, DataType, Data);
            },
            
            /** 
            * Compute the size in bytes for the raster, this includes the IFD as well as the stored data
            */
            ComputeSize: function() {
                var isize = 6; //base size of an IFDOffset
                
                //size of tags
                var tagKeys = Object.keys(tags);
                isize += tagKeys.length*12;
                
                //size of tag data
                for(var i=0; i<tagKeys.length; i++) {
                    isize += tags[tagKeys[i]].GetDataSize();
                }

                return isize + dsize;
            },
            
            /** 
            * Writes the binary for this raster to an array given the current end of file
            * 
            * @param {Uint8Array} bdata byte array to write data to, must be pre-allocated to hold final size of file
            * @param {number} EOF current end of file in the bdata array
            * @param {boolean} nextFile true if there is another raster to write after this one
            * 
            * @return {number} new end of file after writing the current raster
            */
            WriteBinary: function(bdata, EOF, nextFile) {
                
                //write out IFD tag count
                var tcbuffer = new ArrayBuffer(2);
                var tcview = new Uint16Array(tcbuffer);
                var tcbview = new Uint8Array(tcbuffer);
                
                var tagKeys = Object.keys(tags);
                //console.log(tagKeys);
                
                tcview[0] = tagKeys.length;
                
                //update slice offsets
                if(!Options.Tiled) {
                    var sliceEOF = EOF + this.ComputeSize()-dsize;
                    var newOffsets = Array(Options.StripByteCounts.length);
                    
                    newOffsets[0] = sliceEOF;
                    
                    for(var i=1 ;i<Options.StripByteCounts.length;i++) {
                        newOffsets[i] = newOffsets[i-1] + Options.StripByteCounts[i-1];
                    }
                    
                    //console.log(Options.StripByteCounts);
                    //console.log(newOffsets);
                    tags[273] = new ClienTiff.TIFFTAG(273, "long", newOffsets); // StripOffsets
                }
                
                bdata[EOF] = tcbview[0];
                EOF++;
                bdata[EOF] = tcbview[1];
                EOF++;
                
                //figure out where EOF will be after tags are written
                var tEOF = EOF + tagKeys.length*12 + 4;
                
                //console.log("Before Writing Tags");
                //console.log(EOF);
                //console.log(tEOF);
                //console.log(sliceEOF);
                
                //write the tags while advancing the temporary EOF
                for(var i=0; i<tagKeys.length; i++) {
                    
                    //set the offset for the tag (if not done it won't point to the right location)
                    tags[tagKeys[i]].SetOffset(tEOF);
                    
                    //copy the tag into the binary array
                    var tdata = tags[tagKeys[i]].GetBinary();
                    var tview = new Uint8Array(tdata);
                    
                    for(var j=0;j<12;j++) {
                        bdata[EOF] = tview[j];
                        EOF++;
                    }
                    
                    
                    //copy tag data into the binary array
                    var tsize = tags[tagKeys[i]].GetDataSize();
                    
                    if(tsize>0) { //don't copy if data was written in offset instead
                        tdata = tags[tagKeys[i]].GetDataBinary();
                        tview = new Uint8Array(tdata);
                        
                        for(var j=0;j<tsize;j++) {
                            bdata[tEOF] = tview[j];
                            tEOF++;
                        }
                    }

                }
                
                //console.log("Before Writing Data");
                //console.log(EOF);
                //console.log(tEOF);
                
                //write data
                var dcount = Math.ceil(BitsPerSample/8);
                var dbuffer = new ArrayBuffer(dcount);
                var dview = new DType(dbuffer);
                var dbview = new Uint8Array(dbuffer);
                
                //TODO handle tiled tiffs
                
                if(!Options.Tiled) {
                
                    if(Options.PlanarConfiguration == 2) {
                        //TODO write planar seperate
                    }
                    else { //write planar chunky
                        
                        //console.log("dcount: "+dcount);
                        for(var i=0; i<Data.length; i++) {
                            
                            for(var j=0; j<SamplesPerPixel; j++) {
                                dview[0] = Data[i][j];
                                
                                for(var k=0; k<dcount; k++) {
                                    bdata[tEOF] = dbview[k];
                                    tEOF++;
                                }
                            }
                        }
                    }
                }
                
                //console.log("After Writing");
                //console.log(EOF);
                //console.log(tEOF);
                
                dbuffer = new ArrayBuffer(4);
                dview = new Uint32Array(dbuffer);
                dbview = new Uint8Array(dbuffer);
                
                if(nextFile) {
                    dview[0] = tEOF;
                }
                else {
                    dview[0] = 0;
                }
                
                for(var i=0; i<4; i++) {
                    bdata[EOF] = dbview[i];
                    EOF++;
                }
                
                //console.log("Final");
                //console.log(EOF);
                //console.log(tEOF);
                
                return tEOF;
            }
        };
    },

   /** 
    * @class TIFFTAG
    * 
    * Create a Tiff Tag
    * 
    * @param {number} TagId ID number of the tag to be set (see http://www.awaresystems.be/imaging/tiff/tifftags.html)
    * @param {string} DataType one of "byte" "ascii" "short" "long" "rational" "sbyte" "undefine" "sshort" "int" "slong" "srational" "float" "double"
    * @param {Array|number|string} Data a number, list of numbers, list of pairs of numbers (rational / srational), or string, as appropriate to the DataType
    *             numbers will be automatically converted to the appropriate type, it is your responsibility that the output makes sense 
    *             (eg: there is no error checking on negative numbers converted into unsigned values, or too large numbers converted into smaller types.)
    */
    TIFFTAG: function (TagId, DataType, Data) {
        
        var buffer = new ArrayBuffer(12);
        var id = new Uint16Array(buffer,0,1);
        var type = new Uint16Array(buffer,2,1);
        var count = new Uint32Array(buffer,4,1);
        var offset = new Uint32Array(buffer,8,1);
        
        var dsize = 0;
        var dcount = 0; //actual count in bytes (string padding is not included in the tag count)
        
        id[0] = TagId;
        
        DataType = DataType.toLowerCase();
        
        switch(DataType) {
            case "byte":
                type[0] = 1;
                dsize = 1;
                break;
            case "ascii":
                type[0] = 2;
                dsize = 1;
                break;
            case "short":
                type[0] = 3;
                dsize = 2;
                break;
            case "long":
                type[0] = 4;
                dsize = 4;
                break;
            case "rational":
                type[0] = 5;
                dsize = 8;
                break;
            case "sbyte":
                type[0] = 6;
                dsize = 1;
                break;
            case "undefine":
                type[0] = 7;
                dsize = 1;
                break;
            case "sshort":
                type[0] = 8;
                dsize = 2;
                break;
            case "int":
            case "slong":
                type[0] = 9;
                dsize = 4;
                break;
            case "srational":
                type[0] = 10;
                dsize = 8;
                break;
            case "float":
                type[0] = 11;
                dsize = 4;
                break;
            case "double":
                type[0] = 12;
                dsize = 8;
                break;
            default:
                return null;
        }
        
        //Determine how many data items are present
        //TODO add checks to ensure Data makes sense given DataType
        if(typeof(Data) == 'object') { //assumed to be a list
            
            //rationals are automatically objects, so check for a list of objects
            if ( (DataType == "rational" || DataType == "srational") && typeof(Data[0]) != 'object')
            {
                count[0] = 1;
            }
            else {
                count[0] = Data.length
            }
            dcount = count[0];
        }
        else if(typeof(Data) == 'string') {
            var ln = Data.length;
            
            //account for padding and null terminator
            if (Math.floor(ln/2) == ln/2) {
                dcount = ln+2;
            }
            else {
                dcount = ln+1;
            }
            count[0] = ln+1;
        }
        else {
            count[0] = 1;
            dcount = 1;
        }
        
        return {
            /**
            * Get the byte array for the tag itself
            * 
            * @returns {ArrayBuffer}
            */
            GetBinary: function() {
                return buffer;
            },
            
            /**
            * Set the file offset pointer to the current end of the file.
            * If the data size is 4 bytes or less, the offset will instead hold the data.
            * 
            * @param {number} current end of file
            */
            SetOffset: function(EOF) {
                
                var size = dsize*dcount;
                
                //offset is really the data, write that instead
                if(size<=4) {
                    var data = this.GetDataBinary();
                    var dview = new Uint8Array(data);
                    var bview = new Uint8Array(buffer,8,4);
                    
                    for(var i=0;i<4;i++) {
                        if(i<size) {
                            bview[i] = dview[i];
                        }
                        else {
                            bview[i] = 0;
                        }
                    }
                }
                else {
                    offset[0] = EOF;
                }
            },
            
            /**
            * Update the data payload for this tag, new data must have the same count as the previous data
            * 
            * @param {Array|number|string} Data
            * 
            * @returns {boolean} true if data was set successfully
            */
            SetData: function(Data) {
                var tcount;
                
                //ensure data lengths are the same
                //TODO ensure data type is correct
                if(typeof(Data) == 'object') { //assumed to be a list
            
                    //rationals are automatically objects, so check for a list of objects
                    if ( (DataType == "rational" || DataType == "srational") && typeof(Data[0]) != 'object')
                    {
                        tcount = 1;
                    }
                    else {
                        tcount = Data.length
                    }
                }
                else if(typeof(Data) == 'string') {
                    var ln = Data.length;
                    
                    //account for padding and null terminator
                    if (Math.floor(ln/2) == ln/2) {
                        tcount = ln+2;
                    }
                    else {
                        tcount = ln+1;
                    }
                }
                else {
                    tcount = 1;
                }
                
                if (tcount == dcount) {
                    this.Data = Data;
                    return true;
                }

                return false;
            },
            
            /** 
            * Gets the size of the external data block in bytes.
            * If the data size is 4 bytes or less this method returns 0 (all data will be stored within the tag itself)
            * 
            * @returns {number}
            */
            GetDataSize: function() {
                
                if(dsize*dcount<=4) {
                    return 0;
                }
                
                return dsize*dcount;
            },
            
            /** 
            * Get the byte array for the tag's data
            * 
            * @returns {ArrayBuffer}
            */
            GetDataBinary: function() {
                var dbuffer = new ArrayBuffer(dsize*dcount);
                var dview;
                
                //handle the rationals
                if(DataType == "rational" || DataType == "srational") {
                    
                    if(DataType == "rational") {
                        dview = new Uint32Array(dbuffer);
                    }
                    else {
                        dview = new Int32Array(dbuffer);
                    }
                    
                    //single rational
                    if(typeof(Data[0]) != 'object') {
                        dview[0] = Data[0];
                        dview[1] = Data[1];
                    }
                    else { //list of rationals
                        
                        for(var i=0; i<dcount; i++)
                        {
                            dview[i*2] = Data[i][0];
                            dview[i*2+1] = Data[i][1];
                        }
                    }
                    
                    return dbuffer;
                }
                
                //everything else
                switch(DataType) {
                    case "byte":
                    case "ascii":     
                    case "undefine":
                        dview = new Uint8Array(dbuffer);
                        break;
                    case "sbyte":
                        dview = new Int8Array(dbuffer);
                        break;
                    case "short":
                        dview = new Uint16Array(dbuffer);
                        break;
                    case "sshort":
                        dview = new Int16Array(dbuffer);
                        break;
                    case "long":
                        dview = new Uint32Array(dbuffer);
                    case "int":
                    case "slong":
                        dview = new Int32Array(dbuffer);
                        break;
                    case "float":
                        dview = new Float32Array(dbuffer);
                        break;
                    case "double":
                        dview = new Float64Array(dbuffer);
                        break;
                    default:
                        return null;
                }
                
                if(typeof(Data) == 'object') {
                    for(var i=0; i<dcount; i++)
                    {
                        dview[i] = Data[i];
                    }
                }
                else if(typeof(Data) == 'string') {
                    for(var i=0; i<count[0]; i++)
                    {
                        dview[i] = Data.charCodeAt(i);
                    }
                    dview[count[0]] = '\0'.charCodeAt(i);
                }
                else {
                    dview[0] = Data;
                }
                
                return dbuffer;
            }
        };
    },

   /**
    * @class GeoKeyEntry
    * 
    * Create a GeoTiff GeoKey
    * 
    * @param {number} keyId key id (see http://www.remotesensing.org/geotiff/spec/geotiff2.7.html)
    * @param {string} DataType one of "short" "double" "ascii"
    * @param {Array|number|string} Data number, list of numbers, or string as appropriate to DataType
    */
    GeoKeyEntry: function (keyId, DataType, Data) {
        
        var keyEntry = [0,0,0,0];
        
        keyEntry[0] = keyId;
        
        DataType = DataType.toLowerCase();
        
        switch(DataType) {
            case "short":
                
                //if data is small enough, store it within the geokey
                if(typeof(Data) == 'object' && Data.length==1) {
                    keyEntry[1] == 0;
                    keyEntry[3] = Data[0];
                }
                else if(typeof(Data) == 'number') {
                    keyEntry[1] == 0;
                    keyEntry[3] = Data;
                }
                else {
                    keyEntry[1] = 34735; //store data in the short tag
                }
                break;
                
            case "double":
                keyEntry[1] = 34736; //store data in the double tag
                break;
                
            case "ascii":
                Data = Data + '|'; //geotiff spec uses pipe as a string terminator
                
                keyEntry[1] = 34737; //store data in the ascii tag
                
                break;
            default:
                return null;
        }
        
        if(typeof(Data) == 'object' || typeof(Data) == 'string') // assumes data is an array
        {
            keyEntry[2] = Data.length;
        }
        else {
            keyEntry[2] = 1;
        }
        
        return {
           /**
            * Sets the key data offset and appends the key's data to the specified array
            * 
            * @param {Array} darray array of values to append the key's data to
            * @param {number} EOF offset (used in the short array to account for the key's that will appear prior to the data, should be 0 for double and ascii)
            * 
            * @returns {Array}
            */
            AppendToArray: function (darray,EOF) {
                keyEntry[3] = EOF + darray.length;
                
                darray = darray.concat(Data);
                return darray;
            },
            
           /**
            * Returns the key itself
            * 
            * @returns {Array}
            */
            GetEntry: function () {
                return keyEntry;
            },
            
           /**
            * Returns which tag the data should be stored in 34735, 34736 or 34737
            * 
            * @returns {number}
            */
            GetType: function () {
                return keyEntry[1];
            }
        };
    },

   /**
    * 
    * @class GeoKeyDirectory
    * 
    * Sets up metadata to convert a Tiff into a Geotiff
    */
    GeoKeyDirectory: function () {
        var keys = {};

        
        
        return {
            /**
            * Create a GeoTiff GeoKey
            * 
            * @param {number} keyId key id (see http://www.remotesensing.org/geotiff/spec/geotiff2.7.html)
            * @param {string} DataType one of "short" "double" "ascii"
            * @param {Array|number|string} Data number, list of numbers, or string as appropriate to DataType
            */
            SetKey: function (keyId, DataType, Data) {
                keys[keyId] = new ClienTiff.GeoKeyEntry(keyId, DataType, Data);
            },
            
            /** Defines a 2D (6 parameter) coordinate transformation for the specified raster:
            * [x-upper-left, x-shift-per-i, x-shift-per-j, y-upper-left, y-shift-per-i, y-shift-per-j]
            * 
            * @param {TIFFIFD} raster raster to apply the transformation tag to
            */
            Define2DTransform: function (raster, transform) {
                
                if(transform.length != 6) {
                    console.log("Invalid transformation: "+transform);
                    return false;
                }
                
                var matrix = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
                matrix[0] = transform[1];
                matrix[1] = transform[2];
                matrix[3] = transform[0];
                matrix[4] = transform[4];
                matrix[5] = transform[5];
                matrix[7] = transform[3];
                matrix[15] = 1;
                raster.SetTag(34264,"double",matrix);
                
                return true;
            },
            
            //TODO Define3DTransform
            
            //TODO Model Tiepoint with Cellsize
            
            /**
            * Write out the Geotiff GeoKeyDirectory and associated data tags to the specified raster
            * 
            * @param {TIFFIFD} raster to apply metadata to
            */
            WriteMetadata: function (raster) {
                var sarray = [];
                var s2array = []
                
                var tarray = [];
                var darray = [];
                
                //console.log(keys);
                
                var okeys = Object.keys(keys);
                var keycount = okeys.length;
                
                //console.log(okeys);
                
                //write out the directory header
                sarray.push(1); //KeyDirectoryVersion
                sarray.push(1); //KeyRevision
                sarray.push(2); //MinorRevision
                sarray.push(keycount); //number of keys
                
                var soffset = 4 + 4*keycount;
                
                //write key data to geotiff data tags
                for(var i=0;i<okeys.length;i++) {
                    var entry = keys[okeys[i]];
                    
                    //console.log(entry.GetEntry());
                    
                    //add key data to end of appropriate array
                    switch(entry.GetType()) {
                        case 34735:
                            s2array = entry.AppendToArray(s2array,soffset);
                            break;
                        case 34736:
                            darray = entry.AppendToArray(darray,0);
                            break;
                        case 34737:
                            tarray = entry.AppendToArray(tarray,0);
                    }
                    
                    //add the entry to the list
                    sarray = sarray.concat(entry.GetEntry());
                }
                
                //append the two short arrays
                sarray = sarray.concat(s2array);
                
                //console.log(sarray);
                //console.log(darray);
                //console.log(tarray);
                
                //add keys to raster
                raster.SetTag(34735,"short",sarray);
                raster.SetTag(34736,"double",darray);
                raster.SetTag(34737,"ascii",tarray);
            }
        };
    }
};