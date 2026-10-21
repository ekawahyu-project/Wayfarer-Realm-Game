import * as THREE from "three";

export class GeometryBatcher {
  private positions: number[] = [];
  private normals: number[] = [];
  private uvs: number[] = [];
  private indices: number[] = [];
  private vertexOffset = 0;
  private tempMatrix = new THREE.Matrix4();
  private normalMatrix = new THREE.Matrix3();
  private tempPos = new THREE.Vector3();
  private tempNorm = new THREE.Vector3();
  private tempQuat = new THREE.Quaternion();
  private tempEuler = new THREE.Euler();
  private tempScale = new THREE.Vector3();

  addGeometry(
    geom: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
    rotX = 0,
    rotY = 0,
    rotZ = 0,
    sx = 1,
    sy = 1,
    sz = 1
  ) {
    this.tempEuler.set(rotX, rotY, rotZ, "YXZ");
    this.tempQuat.setFromEuler(this.tempEuler);
    this.tempScale.set(sx, sy, sz);
    this.tempMatrix.compose(this.tempPos.set(x, y, z), this.tempQuat, this.tempScale);
    this.normalMatrix.getNormalMatrix(this.tempMatrix);

    const posAttr = geom.attributes.position;
    const normAttr = geom.attributes.normal;
    const uvAttr = geom.attributes.uv;
    const indexAttr = geom.index;

    for (let i = 0; i < posAttr.count; i++) {
      this.tempPos.fromBufferAttribute(posAttr, i).applyMatrix4(this.tempMatrix);
      this.positions.push(this.tempPos.x, this.tempPos.y, this.tempPos.z);

      if (normAttr) {
        this.tempNorm.fromBufferAttribute(normAttr, i).applyMatrix3(this.normalMatrix).normalize();
        this.normals.push(this.tempNorm.x, this.tempNorm.y, this.tempNorm.z);
      } else {
        this.normals.push(0, 1, 0);
      }

      if (uvAttr) {
        this.uvs.push(uvAttr.getX(i), uvAttr.getY(i));
      } else {
        this.uvs.push(0, 0);
      }
    }

    if (indexAttr) {
      for (let i = 0; i < indexAttr.count; i++) {
        this.indices.push(this.vertexOffset + indexAttr.getX(i));
      }
    } else {
      for (let i = 0; i < posAttr.count; i++) {
        this.indices.push(this.vertexOffset + i);
      }
    }

    this.vertexOffset += posAttr.count;
  }

  toBufferGeometry(): THREE.BufferGeometry {
    const merged = new THREE.BufferGeometry();
    merged.setAttribute("position", new THREE.Float32BufferAttribute(this.positions, 3));
    merged.setAttribute("normal", new THREE.Float32BufferAttribute(this.normals, 3));
    merged.setAttribute("uv", new THREE.Float32BufferAttribute(this.uvs, 2));
    merged.setIndex(this.indices);
    return merged;
  }
}
