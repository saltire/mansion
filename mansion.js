class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static distance(pt1, pt2) {
    const dx = pt1.x - pt2.x;
    const dy = pt1.y - pt2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

class Mansion {
  constructor(seed, size) {
    this.seed = seed;

    this.floorHeight = 1.0;
    this.baseHeight = 0.0;
    this.towerFactor = 1.5;
    this.hipRoof = false;
    this.pitch = 0.8;

    let f = this.random();
    const fill = size * size / 2 + f * f * f * size / 2;
    this.symH = this.random() < 0.1;
    this.symV = this.random() < 0.1;

    this.buildPlan(size, size, fill | 0);
    this.buildWings();

    this.drawPlan();
  }

  drawPlan() {
    console.log(this.plan.map((row, y) => {
      return row.map((cell, x) => {
        if (!cell) {
          return ' ';
        }

        const wingNum = this.wings.findIndex(wing => (
          x >= wing.x &&
          x < wing.x + wing.w &&
          y >= wing.y &&
          y < wing.y + wing.h));

        return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[wingNum];
      }).join(' ');
    }).join('\n'));
  }

  random() {
    // this.seed = (this.seed * 48271.0 % 2147483647 | 0) / 2147483647;
    // return this.seed;
    return Math.random();
  }

  randomFromArray(a) {
    return a[this.random() * a.length | 0];
  }

  buildPlan(width, height, fill) {
    this.planW = width;
    this.planH = height;
    let ok;

    while(true) {
			this.plan = [];
      for (let y = 0; y < this.planH; y++) {
				let row = [];
        for (let x = 0; x < this.planW; x++) {
					row.push(false);
        }
				this.plan.push(row);
      }

			this.plan[this.planH / 2 | 0][this.planW / 2 | 0] = true;
			let weight = 1;
			while (weight < fill) {
				let x = this.random() * this.planW | 0;
        let y = this.random() * this.planH | 0;

				if (!this.plan[y][x] && (
          x > 0 && this.plan[y][x - 1] ||
          x < this.planW - 1 && this.plan[y][x + 1] ||
          y > 0 && this.plan[y - 1][x] ||
          y < this.planH - 1 && this.plan[y + 1][x]
        )) {
					this.plan[y][x] = true;
          ++weight;

					if (this.symH && !this.plan[y][this.planW - x - 1]) {
            this.plan[y][this.planW - x - 1] = true;
            ++weight;
          }

					if (this.symV && !this.plan[this.planH - y - 1][x]) {
            this.plan[this.planH - y - 1][x] = true;
            ++weight;
          }

					if (this.symH && this.symV && !this.plan[this.planH - y - 1][this.planW - x - 1]) {
            this.plan[this.planH - y - 1][this.planW - x - 1] = true;
            ++weight;
          }
				}
			}

      ok = true;

      {
        for (let y = 1; y < this.planH; y++) {
          for (let x = 1; x < this.planW; x++) {
            const a = this.plan[y][x];
            const b = this.plan[y - 1][x - 1];
            const c = this.plan[y - 1][x];
            const d = this.plan[y][x - 1];
            if (a == b && c == d && a != c) {
              ok = false;
              continue;
            }
          }
        }
      }

			if (ok) {
				break;
			}
    }

		this.area = 0;
		let cx = 0.0;
		let cy = 0.0;
    for (let y = 0; y < this.planH; y++) {
      for (let x = 0; x < this.planW; x++) {
				if (this.plan[y][x]) {
					this.area++;
					cx += x + 0.5;
					cy += y + 0.5;
				}
			}
    }

    {
      this.center = new Point(cx / this.area, cy / this.area);
      this.radius = 0;
      for (let y = 0; y < this.planH; y++) {
        for (let x = 0; x < this.planW; x++) {
          if (this.plan[y][x]) {
            const d1 = Point.distance(this.center, new Point(x + 0.5, y + 0.5));
            if (this.radius < d1) {
              this.radius = d1;
            }
          }
        }
      }
      this.radius += 0.5;
    }
  }

  buildWings() {
		var plan = [];
    for (let y = 0; y < this.planH; y++) {
			var row = [];
      for (let x = 0; x < this.planW; x++) {
        row.push(this.plan[y][x]);
			}
      plan.push(row);
    }

		this.wings = [];
		while (this.weight(plan) > 0) {
			var wing = this.randomFromArray(this.findLargestWing(plan));
			this.wings.push(wing);
      for (let y = wing.y; y < wing.y + wing.h; y++) {
        for (let x = wing.x; x < wing.x + wing.w; x++) {
          plan[y][x] = false;
        }
			}
		}
  }

  findLargestWing(plan) {
		var largest = null;
		var quality = 0.0;
    for (let y = 0; y < this.planH; y++) {
      for (let x = 0; x < this.planW; x++) {
				if (plan[y][x]) {
					var block = this.findLargestBlock(plan, x, y);
          var q = block.quality();

					if (largest == null || q > quality) {
						largest = [block];
						quality = q;
          }
          else if (q == quality) {
						largest.push(block);
					}
        }
      }
		}
		return largest;
  }

  findLargestBlock(plan, x, y) {
    var largest = null;
    for (let w = 0; w < this.planW - x; w++) {
			if (plan[y][x + w]) {
				var column = this.findTallestColumn(plan, x, y, w + 1);
        if (largest == null || column.quality() > largest.quality()) {
					largest = column;
				}
      }
      else {
				break;
			}
		}
		return largest;
  }

  findTallestColumn(plan, x, y, w) {
    for (let h = 0; h < this.planH - y; h++) {
      for (let w1 = 0; w1 < w; w1++) {
				if (!plan[y + h][x + w1]) {
					return new Wing(this, x, y, w, h);
        }
      }
		}
		return new Wing(this, x, y, w, this.planH - y);
  }

  weight(plan) {
    var count = 0;
    for (let y = 0; y < this.planH; y++) {
      for (let x = 0; x < this.planW; x++) {
				if (plan[y][x]) {
					++count;
        }
      }
		}
		return count;
	}
}

class Wing {
  constructor(mansion, x, y, w, h) {
    this.chimney = null;
    this.windows = [];
    this.door = null;
    this.ground = 0;
    this.height = 0;
    this.hipRoof = false;
    this.mansion = mansion;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.hipRoof = mansion.hipRoof;
  }

  quality() {
    return this.w * this.h > Math.sqrt(this.mansion.area) * 2 ? 0 :
      this.w * this.h + (this.w < this.h ? this.w : this.h);
  }
}

new Mansion(1, 20);
process.exit();
