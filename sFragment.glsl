precision mediump float;

#define ITER 1600
#define AA 3.

uniform vec2 Resolution;
uniform float Zoom;
uniform vec2 Reference;
uniform vec2 CenterOffset;
// Currently unused.
uniform vec2 Series[4];
uniform float Time;

vec2 cMul(vec2 a, vec2 b){
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

vec2 cSquare(vec2 c){
    return vec2(c.x*c.x - c.y*c.y, 2.0*c.x*c.y);
}

float mandelSetNaive(vec2 c){
    c += Reference;
    vec2 z = vec2(0);
    float norm;

    for (int i=0; i<ITER; i++){
        z = cSquare(z) + c;

        norm = dot(z,z);
        if (norm < 0.001)
            return 0.;
        if (norm > 4.)
            return 1.;

    }
    return 0.;
}

float mandelSetPerturb(vec2 d0) {
	vec2 dz = cMul(Series[1], d0) + cMul(Series[2], cSquare(d0)) + cMul(Series[3], cMul(cSquare(d0), d0));
	if (length(Series[0] + dz) > 2.) return 1.;
	return 0.;
}

float mandelbrot_IQ( vec2 dc ) {
    // https://twitter.com/iquilezles/status/1232998904766984192
    vec2 z  = vec2(0.0);
    vec2 dz = vec2(0.0);
    float norm;

    for( int i=0; i<ITER; i++ ) {
        // IQ's original update function
        // dz = cMul(2.0*z + dz, dz) + dc;

        // I reckon that multiplying z, dz first loses less precision.
        // Barely noticable in the plot though...
        dz = cMul(2.0*z, dz) + cSquare(dz) + dc;

        // Could be precomputed since it's constant for all pixels.
        z  = cMul(z,z) + Reference;

        norm = dot(z+dz,z+dz);
        if (norm < 0.001)
            return 0.;
        if (norm > 4.)
            return 1.;
    }
    return 0.;
}

void main() {
    float scale = pow(10.0, Zoom);
    vec2 uv = scale * (2.0*gl_FragCoord.xy - Resolution) / Resolution.y;
    float pixSize = 2.0 * scale / Resolution.y;
    uv -= CenterOffset * 2.0 / Resolution.y;

    vec3 col = vec3(0);
    for (float i=0.; i<AA; i++) {
        for (float j=0.; j<AA; j++) {
			vec2 dc = uv + pixSize * vec2(i+1., j+1.) / (AA + 1.);

            if (dot(dc,dc) < pow(2.*pixSize, 2.))
                col += vec3(0.2,0.8,0.5);
            else
                col += mandelbrot_IQ(dc);
                // col += mandelSetNaive(dc);
        }
    }
    col /= AA * AA;

    gl_FragColor = vec4(col,1);
}
