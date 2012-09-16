/** 
 * FrameBufferObject manage fbo / rtt 
 * @class FrameBufferObject
 */
osg.FrameBufferObject = function () {
    osg.StateAttribute.call(this);
    this.fbo = undefined;
    this.attachments = [];
    this.dirty();
};

osg.FrameBufferObject.COLOR_ATTACHMENT0 = 0x8CE0;
osg.FrameBufferObject.DEPTH_ATTACHMENT = 0x8D00;
osg.FrameBufferObject.DEPTH_COMPONENT16 = 0x81A5;

/** @lends osg.FrameBufferObject.prototype */
osg.FrameBufferObject.prototype = osg.objectInehrit(osg.StateAttribute.prototype, {
    attributeType: "FrameBufferObject",
    cloneType: function() {return new osg.FrameBufferObject(); },
    getType: function() { return this.attributeType;},
    getTypeMember: function() { return this.attributeType;},
    setAttachment: function(attachment) { this.attachments.push(attachment); },
    _reportFrameBufferError : function(code) {
        switch (code) {
        case 0x8CD6:
            osg.debug("FRAMEBUFFER_INCOMPLETE_ATTACHMENT");
            break;
        case 0x8CD7:
            osg.debug("FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT");
            break;
        case 0x8CD9:
            osg.debug("FRAMEBUFFER_INCOMPLETE_DIMENSIONS");
            break;
        case 0x8CDD:
            osg.debug("FRAMEBUFFER_UNSUPPORTED");
            break;
        default:
            osg.debug("FRAMEBUFFER unknown error " + code.toString(16));
        }
    },
    apply: function(state) {
        var gl = state.getGraphicContext();
        var status;
        if (this.attachments.length > 0) {
            if (this.isDirty()) {

                if (!this.fbo) {
                    this.fbo = gl.createFramebuffer();
                }

                gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
                var hasRenderBuffer = false;
                for (var i = 0, l = this.attachments.length; i < l; ++i) {
                    
                    if (this.attachments[i].texture === undefined) { // render buffer
                        var rb = gl.createRenderbuffer();
                        gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
                        gl.renderbufferStorage(gl.RENDERBUFFER, this.attachments[i].format, this.attachments[i].width, this.attachments[i].height);
                        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, this.attachments[i].attachment, gl.RENDERBUFFER, rb);
                        hasRenderBuffer = true;
                    } else {
                        var texture = this.attachments[i].texture;
                        // apply on unit 0 to init it
                        state.applyTextureAttribute(0, texture);
                        
                        //gl.framebufferTexture2D(gl.FRAMEBUFFER, this.attachments[i].attachment, texture.getTextureTarget(), texture.getTextureObject(), this.attachments[i].level);
                        gl.framebufferTexture2D(gl.FRAMEBUFFER, this.attachments[i].attachment, texture.getTextureTarget(), texture.getTextureObject(), this.attachments[i].level);
                    }
                }
                status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                if (status !== 0x8CD5) {
                    this._reportFrameBufferError(status);
                }
                
                if (hasRenderBuffer) { // set it to null only if used renderbuffer
                    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
                }
                this.setDirty(false);
            } else {
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
                if (osg.reportWebGLError === true) {
                    status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                    if (status !== 0x8CD5) {
                        this._reportFrameBufferError(status);
                    }
                }
            }
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
    }
});
