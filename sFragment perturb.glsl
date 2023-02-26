precision mediump float;

#define AA 2.
#define ITER 2500

uniform vec2 Resolution;
uniform float Scale;
uniform vec2 Reference;
uniform vec2 CenterOffset;
uniform vec2 Series[4];
uniform int IterationsSkipped;

vec2 cMul(vec2 a, vec2 b){
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

vec2 cSquare(vec2 c){
    return vec2(c.x*c.x - c.y*c.y, 2.0*c.x*c.y);
}

float mandelSetPerturb(vec2 d0) {
	vec2 d = cMul(Series[0], d0)
        + cMul(Series[1], cSquare(d0))
        + cMul(Series[2], cMul(cSquare(d0), d0));

    if (length(Series[0] + d) > 2.) return 1.;
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
                col += mandelSetPerturb(dc);
        }
    }
    col /= AA * AA;

    gl_FragColor = vec4(col,1);
}
