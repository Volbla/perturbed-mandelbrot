precision mediump float;

#define AA 2.
#define ITER 6000

uniform vec2 Resolution;
uniform float Scale;
uniform vec2 Reference;
uniform vec2 CenterOffset;

vec2 cMul(vec2 a, vec2 b){
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

vec2 cSquare(vec2 c){
    return vec2(c.x*c.x - c.y*c.y, 2.0*c.x*c.y);
}

float mandelbrot_IQ( vec2 dc ) {
    // https://twitter.com/iquilezles/status/1232998904766984192
    vec2 z  = vec2(0.0);
    vec2 dz = vec2(0.0);
    float normSquared;

    for( int i=0; i<ITER; i++ ) {
        // IQ's original update function
        // dz = cMul(2.0*z + dz, dz) + dc;

        // I reckon that multiplying z, dz first loses less precision.
        // Barely noticable in the plot though...
        dz = cMul(2.0*z, dz) + cSquare(dz) + dc;

        // Could be precomputed since it's constant for all pixels.
        z  = cMul(z,z) + Reference;

        normSquared = dot(z+dz,z+dz);
        if (normSquared < 0.000001)
            return 0.;
        if (normSquared > 4.)
            return 1.;
    }
    return 0.;
}

void main() {
    vec2 uv = Scale * (2.0*gl_FragCoord.xy - Resolution) / Resolution.y;
    uv -= CenterOffset;

    float pixSize = 2.0 * Scale / Resolution.y;
    float smallRadiusSquared = pow(2.*pixSize, 2.);

    vec3 col = vec3(0);
    for (float i=0.; i<AA; i++) {
        for (float j=0.; j<AA; j++) {
			vec2 dc = uv + pixSize * vec2(i+1., j+1.) / (AA + 1.);

            if (dot(dc,dc) < smallRadiusSquared)
                col += vec3(0.2,0.8,0.2);
            else
                col += mandelbrot_IQ(dc);
        }
    }
    col /= AA * AA;

    gl_FragColor = vec4(col,1);
}
