import { use, expect } from "chai"
import chaiHttp from 'chai-http'
import deepEqualInAnyOrder from 'deep-equal-in-any-order'
let chai = use(chaiHttp)
use(deepEqualInAnyOrder)

global.chai = chai
