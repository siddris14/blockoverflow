uniform float uTime;
uniform vec3 uColour1;
uniform vec3 uColour2;

varying vec3 vPosition;

void main(){

    vec3 color = vec3(0., 1., 1.);
    float sceneDepth = vPosition.z * .5 + .5;

    color = mix(uColour1, uColour2, sceneDepth);

    gl_FragColor = vec4(color, sceneDepth * 1. + .2);

}
