attribute vec3 aRandom;

uniform float uTime;
uniform float uScale;
uniform float uAmplitude;
uniform float uFrequency;
uniform float uTimeFrequency;
uniform float uRandomFrequency;

varying vec3 vPosition;

void main() {

    float newTime = uTime * uTimeFrequency;

    vec3 newPosition = position;
    newPosition.x += sin(newTime * aRandom.x) * uRandomFrequency;
    newPosition.y += cos(newTime * aRandom.y) * uRandomFrequency;
    newPosition.z += cos(newTime * aRandom.z) * uRandomFrequency;

    newPosition.x *= uScale + (sin(newPosition.y * uFrequency + newTime) * (1. - uScale));
    newPosition.y *= uScale + (cos (newPosition.z * uFrequency + newTime) * (1. - uScale));
    newPosition.z *= uScale + (sin(newPosition.x * uFrequency + newTime) * (1. - uScale));

    newPosition *= uScale;

    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.);

    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uAmplitude / -mvPosition.z;

    // Varyings
    vPosition = position;

}