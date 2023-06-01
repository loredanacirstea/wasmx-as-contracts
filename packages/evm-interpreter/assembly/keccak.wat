
;;
;; Copied from https://github.com/axic/keccak-wasm (has more comments)
;;

;;
;; memcpy from ewasm-libc/ewasm-cleanup
;;
(func $memset
  (param $ptr i32)
  (param $value i32)
  (param $length i32)
  (result i32)
  (local $i i32)

  (local.set $i (i32.const 0))

  (block $done
    (loop $loop
      (if (i32.ge_u (local.get $i) (local.get $length))
        (br $done)
      )

      (i32.store8 (i32.add (local.get $ptr) (local.get $i)) (local.get $value))

      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br $loop)
    )
  )
  (local.get $ptr)
)

;;
;; memcpy from ewasm-libc/ewasm-cleanup
;;
(func $memcpy
  (param $dst i32)
  (param $src i32)
  (param $length i32)
  (result i32)

  (local $i i32)

  (local.set $i (i32.const 0))

  (block $done
    (loop $loop
      (if (i32.ge_u (local.get $i) (local.get $length))
        (br $done)
      )

      (i32.store8 (i32.add (local.get $dst) (local.get $i)) (i32.load8_u (i32.add (local.get $src) (local.get $i))))

      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br $loop)
    )
  )

  (return (local.get $dst))
)

(func $keccak_theta
  (param $context_offset i32)

  (local $C0 i64)
  (local $C1 i64)
  (local $C2 i64)
  (local $C3 i64)
  (local $C4 i64)
  (local $D0 i64)
  (local $D1 i64)
  (local $D2 i64)
  (local $D3 i64)
  (local $D4 i64)

  ;; C[x] = A[x] ^ A[x + 5] ^ A[x + 10] ^ A[x + 15] ^ A[x + 20];
  (local.set $C0
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 0)))
      (i64.xor
        (i64.load (i32.add (local.get $context_offset) (i32.const 40)))
        (i64.xor
          (i64.load (i32.add (local.get $context_offset) (i32.const 80)))
          (i64.xor
            (i64.load (i32.add (local.get $context_offset) (i32.const 120)))
            (i64.load (i32.add (local.get $context_offset) (i32.const 160)))
          )
        )
      )
    )
  )

  (local.set $C1
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 8)))
      (i64.xor
        (i64.load (i32.add (local.get $context_offset) (i32.const 48)))
        (i64.xor
          (i64.load (i32.add (local.get $context_offset) (i32.const 88)))
          (i64.xor
            (i64.load (i32.add (local.get $context_offset) (i32.const 128)))
            (i64.load (i32.add (local.get $context_offset) (i32.const 168)))
          )
        )
      )
    )
  )

  (local.set $C2
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 16)))
      (i64.xor
        (i64.load (i32.add (local.get $context_offset) (i32.const 56)))
        (i64.xor
          (i64.load (i32.add (local.get $context_offset) (i32.const 96)))
          (i64.xor
            (i64.load (i32.add (local.get $context_offset) (i32.const 136)))
            (i64.load (i32.add (local.get $context_offset) (i32.const 176)))
          )
        )
      )
    )
  )

  (local.set $C3
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 24)))
      (i64.xor
        (i64.load (i32.add (local.get $context_offset) (i32.const 64)))
        (i64.xor
          (i64.load (i32.add (local.get $context_offset) (i32.const 104)))
          (i64.xor
            (i64.load (i32.add (local.get $context_offset) (i32.const 144)))
            (i64.load (i32.add (local.get $context_offset) (i32.const 184)))
          )
        )
      )
    )
  )

  (local.set $C4
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 32)))
      (i64.xor
        (i64.load (i32.add (local.get $context_offset) (i32.const 72)))
        (i64.xor
          (i64.load (i32.add (local.get $context_offset) (i32.const 112)))
          (i64.xor
            (i64.load (i32.add (local.get $context_offset) (i32.const 152)))
            (i64.load (i32.add (local.get $context_offset) (i32.const 192)))
          )
        )
      )
    )
  )

  ;; D[0] = ROTL64(C[1], 1) ^ C[4];
  (local.set $D0
    (i64.xor
      (local.get $C4)
      (i64.rotl
        (local.get $C1)
        (i64.const 1)
      )
    )
  )

  ;; D[1] = ROTL64(C[2], 1) ^ C[0];
  (local.set $D1
    (i64.xor
      (local.get $C0)
      (i64.rotl
        (local.get $C2)
        (i64.const 1)
      )
    )
  )

  ;; D[2] = ROTL64(C[3], 1) ^ C[1];
  (local.set $D2
    (i64.xor
      (local.get $C1)
      (i64.rotl
        (local.get $C3)
        (i64.const 1)
      )
    )
  )

  ;; D[3] = ROTL64(C[4], 1) ^ C[2];
  (local.set $D3
    (i64.xor
      (local.get $C2)
      (i64.rotl
        (local.get $C4)
        (i64.const 1)
      )
    )
  )

  ;; D[4] = ROTL64(C[0], 1) ^ C[3];
  (local.set $D4
    (i64.xor
      (local.get $C3)
      (i64.rotl
        (local.get $C0)
        (i64.const 1)
      )
    )
  )

  ;; A[x]      ^= D[x];
  ;; A[x + 5]  ^= D[x];
  ;; A[x + 10] ^= D[x];
  ;; A[x + 15] ^= D[x];
  ;; A[x + 20] ^= D[x];

  ;; x = 0
  (i64.store (i32.add (local.get $context_offset) (i32.const 0))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 0)))
      (local.get $D0)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 40))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 40)))
      (local.get $D0)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 80))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 80)))
      (local.get $D0)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 120))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 120)))
      (local.get $D0)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 160))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 160)))
      (local.get $D0)
    )
  )

  ;; x = 1
  (i64.store (i32.add (local.get $context_offset) (i32.const 8))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 8)))
      (local.get $D1)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 48))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 48)))
      (local.get $D1)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 88))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 88)))
      (local.get $D1)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 128))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 128)))
      (local.get $D1)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 168))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 168)))
      (local.get $D1)
    )
  )

  ;; x = 2
  (i64.store (i32.add (local.get $context_offset) (i32.const 16))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 16)))
      (local.get $D2)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 56))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 56)))
      (local.get $D2)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 96))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 96)))
      (local.get $D2)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 136))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 136)))
      (local.get $D2)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 176))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 176)))
      (local.get $D2)
    )
  )

  ;; x = 3
  (i64.store (i32.add (local.get $context_offset) (i32.const 24))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 24)))
      (local.get $D3)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 64))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 64)))
      (local.get $D3)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 104))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 104)))
      (local.get $D3)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 144))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 144)))
      (local.get $D3)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 184))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 184)))
      (local.get $D3)
    )
  )

  ;; x = 4
  (i64.store (i32.add (local.get $context_offset) (i32.const 32))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 32)))
      (local.get $D4)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 72))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 72)))
      (local.get $D4)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 112))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 112)))
      (local.get $D4)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 152))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 152)))
      (local.get $D4)
    )
  )

  (i64.store (i32.add (local.get $context_offset) (i32.const 192))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 192)))
      (local.get $D4)
    )
  )
)

(func $keccak_rho
  (param $context_offset i32)
  (param $rotation_consts i32)

  ;;(local $tmp i32)

  ;; state[ 1] = ROTL64(state[ 1],  1);
  ;;(local.set $tmp (i32.add (local.get $context_offset) (i32.const 1)))
  ;;(i64.store (local.get $tmp) (i64.rotl (i64.load (local.get $context_offset)) (i64.const 1)))

  ;;(local.set $tmp (i32.add (local.get $context_offset) (i32.const 2)))
  ;;(i64.store (local.get $tmp) (i64.rotl (i64.load (local.get $context_offset)) (i64.const 62)))

  (local $tmp i32)
  (local $i i32)

  ;; for (i = 0; i <= 24; i++)
  (local.set $i (i32.const 0))
  (block $done
    (loop $loop
      (if (i32.ge_u (local.get $i) (i32.const 24))
        (br $done)
      )

      (local.set $tmp (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (i32.add (i32.const 1) (local.get $i)))))

      (i64.store (local.get $tmp) (i64.rotl (i64.load (local.get $tmp)) (i64.load8_u (i32.add (local.get $rotation_consts) (local.get $i)))))

      (local.set $i (i32.add (local.get $i) (i32.const 1)))
      (br $loop)
    )
  )
)

(func $keccak_pi
  (param $context_offset i32)

  (local $A1 i64)
  (local.set $A1 (i64.load (i32.add (local.get $context_offset) (i32.const 8))))

  ;; Swap non-overlapping fields, i.e. $A1 = $A6, etc.
  ;; NOTE: $A0 is untouched
  (i64.store (i32.add (local.get $context_offset) (i32.const 8)) (i64.load (i32.add (local.get $context_offset) (i32.const 48))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 48)) (i64.load (i32.add (local.get $context_offset) (i32.const 72))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 72)) (i64.load (i32.add (local.get $context_offset) (i32.const 176))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 176)) (i64.load (i32.add (local.get $context_offset) (i32.const 112))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 112)) (i64.load (i32.add (local.get $context_offset) (i32.const 160))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 160)) (i64.load (i32.add (local.get $context_offset) (i32.const 16))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 16)) (i64.load (i32.add (local.get $context_offset) (i32.const 96))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 96)) (i64.load (i32.add (local.get $context_offset) (i32.const 104))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 104)) (i64.load (i32.add (local.get $context_offset) (i32.const 152))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 152)) (i64.load (i32.add (local.get $context_offset) (i32.const 184))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 184)) (i64.load (i32.add (local.get $context_offset) (i32.const 120))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 120)) (i64.load (i32.add (local.get $context_offset) (i32.const 32))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 32)) (i64.load (i32.add (local.get $context_offset) (i32.const 192))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 192)) (i64.load (i32.add (local.get $context_offset) (i32.const 168))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 168)) (i64.load (i32.add (local.get $context_offset) (i32.const 64))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 64)) (i64.load (i32.add (local.get $context_offset) (i32.const 128))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 128)) (i64.load (i32.add (local.get $context_offset) (i32.const 40))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 40)) (i64.load (i32.add (local.get $context_offset) (i32.const 24))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 24)) (i64.load (i32.add (local.get $context_offset) (i32.const 144))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 144)) (i64.load (i32.add (local.get $context_offset) (i32.const 136))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 136)) (i64.load (i32.add (local.get $context_offset) (i32.const 88))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 88)) (i64.load (i32.add (local.get $context_offset) (i32.const 56))))
  (i64.store (i32.add (local.get $context_offset) (i32.const 56)) (i64.load (i32.add (local.get $context_offset) (i32.const 80))))

  ;; Place the previously saved overlapping field
  (i64.store (i32.add (local.get $context_offset) (i32.const 80)) (local.get $A1))
)

(func $keccak_chi
  (param $context_offset i32)

  (local $A0 i64)
  (local $A1 i64)
  (local $i i32)

  ;; for (round = 0; round < 25; i += 5)
  (local.set $i (i32.const 0))
  (block $done
    (loop $loop
      (if (i32.ge_u (local.get $i) (i32.const 25))
        (br $done)
      )

      (local.set $A0 (i64.load (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (local.get $i)))))
      (local.set $A1 (i64.load (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (i32.add (local.get $i) (i32.const 1))))))

      ;; A[0 + i] ^= ~A1 & A[2 + i];
      (i64.store (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (local.get $i)))
        (i64.xor
          (i64.load (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (local.get $i))))
          (i64.and
            (i64.xor (local.get $A1) (i64.const 0xFFFFFFFFFFFFFFFF)) ;; bitwise not
            (i64.load (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (i32.add (local.get $i) (i32.const 2)))))
          )
        )
      )

      ;; A[1 + i] ^= ~A[2 + i] & A[3 + i];
      (i64.store (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (i32.add (local.get $i) (i32.const 1))))
        (i64.xor
          (i64.load (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (i32.add (local.get $i) (i32.const 1)))))
          (i64.and
            (i64.xor (i64.load (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (i32.add (local.get $i) (i32.const 2))))) (i64.const 0xFFFFFFFFFFFFFFFF)) ;; bitwise not
            (i64.load (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (i32.add (local.get $i) (i32.const 3)))))
          )
        )
      )

      ;; A[2 + i] ^= ~A[3 + i] & A[4 + i];
      (i64.store (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (i32.add (local.get $i) (i32.const 2))))
        (i64.xor
          (i64.load (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (i32.add (local.get $i) (i32.const 2)))))
          (i64.and
            (i64.xor (i64.load (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (i32.add (local.get $i) (i32.const 3))))) (i64.const 0xFFFFFFFFFFFFFFFF)) ;; bitwise not
            (i64.load (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (i32.add (local.get $i) (i32.const 4)))))
          )
        )
      )

      ;; A[3 + i] ^= ~A[4 + i] & A0;
      (i64.store (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (i32.add (local.get $i) (i32.const 3))))
        (i64.xor
          (i64.load (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (i32.add (local.get $i) (i32.const 3)))))
          (i64.and
            (i64.xor (i64.load (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (i32.add (local.get $i) (i32.const 4))))) (i64.const 0xFFFFFFFFFFFFFFFF)) ;; bitwise not
            (local.get $A0)
          )
        )
      )

      ;; A[4 + i] ^= ~A0 & A1;
      (i64.store (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (i32.add (local.get $i) (i32.const 4))))
        (i64.xor
          (i64.load (i32.add (local.get $context_offset) (i32.mul (i32.const 8) (i32.add (local.get $i) (i32.const 4)))))
          (i64.and
            (i64.xor (local.get $A0) (i64.const 0xFFFFFFFFFFFFFFFF)) ;; bitwise not
            (local.get $A1)
          )
        )
      )

      (local.set $i (i32.add (local.get $i) (i32.const 5)))
      (br $loop)
    )
  )
)

(func $keccak_permute
  (param $context_offset i32)

  (local $rotation_consts i32)
  (local $round_consts i32)
  (local $round i32)

  (local.set $round_consts (i32.add (local.get $context_offset) (i32.const 400)))
  (local.set $rotation_consts (i32.add (local.get $context_offset) (i32.const 592)))

  ;; for (round = 0; round < 24; round++)
  (local.set $round (i32.const 0))
  (block $done
    (loop $loop
      (if (i32.ge_u (local.get $round) (i32.const 24))
        (br $done)
      )

      ;; theta transform
      (call $keccak_theta (local.get $context_offset))

      ;; rho transform
      (call $keccak_rho (local.get $context_offset) (local.get $rotation_consts))

      ;; pi transform
      (call $keccak_pi (local.get $context_offset))

      ;; chi transform
      (call $keccak_chi (local.get $context_offset))

      ;; iota transform
      ;; context_offset[0] ^= KECCAK_ROUND_CONSTANTS[round];
      (i64.store (local.get $context_offset)
        (i64.xor
          (i64.load (local.get $context_offset))
          (i64.load (i32.add (local.get $round_consts) (i32.mul (i32.const 8) (local.get $round))))
        )
      )

      (local.set $round (i32.add (local.get $round) (i32.const 1)))
      (br $loop)
    )
  )
)

(func $keccak_block
  (param $input_offset i32)
  (param $input_length i32) ;; ignored, we expect keccak256
  (param $context_offset i32)

  ;; read blocks in little-endian order and XOR against context_offset

  (i64.store
    (i32.add (local.get $context_offset) (i32.const 0))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 0)))
      (i64.load (i32.add (local.get $input_offset) (i32.const 0)))
    )
  )

  (i64.store
    (i32.add (local.get $context_offset) (i32.const 8))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 8)))
      (i64.load (i32.add (local.get $input_offset) (i32.const 8)))
    )
  )

  (i64.store
    (i32.add (local.get $context_offset) (i32.const 16))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 16)))
      (i64.load (i32.add (local.get $input_offset) (i32.const 16)))
    )
  )

  (i64.store
    (i32.add (local.get $context_offset) (i32.const 24))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 24)))
      (i64.load (i32.add (local.get $input_offset) (i32.const 24)))
    )
  )

  (i64.store
    (i32.add (local.get $context_offset) (i32.const 32))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 32)))
      (i64.load (i32.add (local.get $input_offset) (i32.const 32)))
    )
  )

  (i64.store
    (i32.add (local.get $context_offset) (i32.const 40))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 40)))
      (i64.load (i32.add (local.get $input_offset) (i32.const 40)))
    )
  )

  (i64.store
    (i32.add (local.get $context_offset) (i32.const 48))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 48)))
      (i64.load (i32.add (local.get $input_offset) (i32.const 48)))
    )
  )

  (i64.store
    (i32.add (local.get $context_offset) (i32.const 56))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 56)))
      (i64.load (i32.add (local.get $input_offset) (i32.const 56)))
    )
  )

  (i64.store
    (i32.add (local.get $context_offset) (i32.const 64))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 64)))
      (i64.load (i32.add (local.get $input_offset) (i32.const 64)))
    )
  )

  (i64.store
    (i32.add (local.get $context_offset) (i32.const 72))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 72)))
      (i64.load (i32.add (local.get $input_offset) (i32.const 72)))
    )
  )

  (i64.store
    (i32.add (local.get $context_offset) (i32.const 80))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 80)))
      (i64.load (i32.add (local.get $input_offset) (i32.const 80)))
    )
  )

  (i64.store
    (i32.add (local.get $context_offset) (i32.const 88))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 88)))
      (i64.load (i32.add (local.get $input_offset) (i32.const 88)))
    )
  )

  (i64.store
    (i32.add (local.get $context_offset) (i32.const 96))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 96)))
      (i64.load (i32.add (local.get $input_offset) (i32.const 96)))
    )
  )

  (i64.store
    (i32.add (local.get $context_offset) (i32.const 104))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 104)))
      (i64.load (i32.add (local.get $input_offset) (i32.const 104)))
    )
  )

  (i64.store
    (i32.add (local.get $context_offset) (i32.const 112))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 112)))
      (i64.load (i32.add (local.get $input_offset) (i32.const 112)))
    )
  )

  (i64.store
    (i32.add (local.get $context_offset) (i32.const 120))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 120)))
      (i64.load (i32.add (local.get $input_offset) (i32.const 120)))
    )
  )

  (i64.store
    (i32.add (local.get $context_offset) (i32.const 128))
    (i64.xor
      (i64.load (i32.add (local.get $context_offset) (i32.const 128)))
      (i64.load (i32.add (local.get $input_offset) (i32.const 128)))
    )
  )

  (call $keccak_permute (local.get $context_offset))
)

;;
;; Initialise the context
;;
(func $keccak_init
  (param $context_offset i32)
  (local $round_consts i32)
  (local $rotation_consts i32)

  (call $keccak_reset (local.get $context_offset))

  ;; insert the round constants (used by $KECCAK_IOTA)
  (local.set $round_consts (i32.add (local.get $context_offset) (i32.const 400)))
  (i64.store (i32.add (local.get $round_consts) (i32.const 0)) (i64.const 0x0000000000000001))
  (i64.store (i32.add (local.get $round_consts) (i32.const 8)) (i64.const 0x0000000000008082))
  (i64.store (i32.add (local.get $round_consts) (i32.const 16)) (i64.const 0x800000000000808A))
  (i64.store (i32.add (local.get $round_consts) (i32.const 24)) (i64.const 0x8000000080008000))
  (i64.store (i32.add (local.get $round_consts) (i32.const 32)) (i64.const 0x000000000000808B))
  (i64.store (i32.add (local.get $round_consts) (i32.const 40)) (i64.const 0x0000000080000001))
  (i64.store (i32.add (local.get $round_consts) (i32.const 48)) (i64.const 0x8000000080008081))
  (i64.store (i32.add (local.get $round_consts) (i32.const 56)) (i64.const 0x8000000000008009))
  (i64.store (i32.add (local.get $round_consts) (i32.const 64)) (i64.const 0x000000000000008A))
  (i64.store (i32.add (local.get $round_consts) (i32.const 72)) (i64.const 0x0000000000000088))
  (i64.store (i32.add (local.get $round_consts) (i32.const 80)) (i64.const 0x0000000080008009))
  (i64.store (i32.add (local.get $round_consts) (i32.const 88)) (i64.const 0x000000008000000A))
  (i64.store (i32.add (local.get $round_consts) (i32.const 96)) (i64.const 0x000000008000808B))
  (i64.store (i32.add (local.get $round_consts) (i32.const 104)) (i64.const 0x800000000000008B))
  (i64.store (i32.add (local.get $round_consts) (i32.const 112)) (i64.const 0x8000000000008089))
  (i64.store (i32.add (local.get $round_consts) (i32.const 120)) (i64.const 0x8000000000008003))
  (i64.store (i32.add (local.get $round_consts) (i32.const 128)) (i64.const 0x8000000000008002))
  (i64.store (i32.add (local.get $round_consts) (i32.const 136)) (i64.const 0x8000000000000080))
  (i64.store (i32.add (local.get $round_consts) (i32.const 144)) (i64.const 0x000000000000800A))
  (i64.store (i32.add (local.get $round_consts) (i32.const 152)) (i64.const 0x800000008000000A))
  (i64.store (i32.add (local.get $round_consts) (i32.const 160)) (i64.const 0x8000000080008081))
  (i64.store (i32.add (local.get $round_consts) (i32.const 168)) (i64.const 0x8000000000008080))
  (i64.store (i32.add (local.get $round_consts) (i32.const 176)) (i64.const 0x0000000080000001))
  (i64.store (i32.add (local.get $round_consts) (i32.const 184)) (i64.const 0x8000000080008008))

  ;; insert the rotation constants (used by $keccak_rho)
  (local.set $rotation_consts (i32.add (local.get $context_offset) (i32.const 592)))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 0)) (i32.const 1))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 1)) (i32.const 62))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 2)) (i32.const 28))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 3)) (i32.const 27))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 4)) (i32.const 36))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 5)) (i32.const 44))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 6)) (i32.const 6))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 7)) (i32.const 55))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 8)) (i32.const 20))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 9)) (i32.const 3))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 10)) (i32.const 10))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 11)) (i32.const 43))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 12)) (i32.const 25))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 13)) (i32.const 39))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 14)) (i32.const 41))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 15)) (i32.const 45))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 16)) (i32.const 15))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 17)) (i32.const 21))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 18)) (i32.const 8))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 19)) (i32.const 18))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 20)) (i32.const 2))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 21)) (i32.const 61))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 22)) (i32.const 56))
  (i32.store8 (i32.add (local.get $rotation_consts) (i32.const 23)) (i32.const 14))
)

;;
;; Reset the context
;;
(func $keccak_reset
  (param $context_offset i32)

  ;; clear out the context memory
  (drop (call $memset (local.get $context_offset) (i32.const 0) (i32.const 400)))
)

;;
;; Push input to the context
;;
(func $keccak_update
  (param $context_offset i32)
  (param $input_offset i32)
  (param $input_length i32)

  (local $residue_offset i32)
  (local $residue_buffer i32)
  (local $residue_index i32)
  (local $tmp i32)

  ;; this is where we store the pointer
  (local.set $residue_offset (i32.add (local.get $context_offset) (i32.const 200)))
  ;; this is where the buffer is
  (local.set $residue_buffer (i32.add (local.get $context_offset) (i32.const 208)))

  (local.set $residue_index (i32.load (local.get $residue_offset)))

  ;; process residue from last block
  (if (i32.ne (local.get $residue_index) (i32.const 0))
    (then
      ;; the space left in the residue buffer
      (local.set $tmp (i32.sub (i32.const 136) (local.get $residue_index)))

      ;; limit to what we have as an input
      (if (i32.lt_u (local.get $input_length) (local.get $tmp))
        (local.set $tmp (local.get $input_length))
      )

      ;; fill up the residue buffer
      (drop (call $memcpy
        (i32.add (local.get $residue_buffer) (local.get $residue_index))
        (local.get $input_offset)
        (local.get $tmp)
      ))

      (local.set $residue_index (i32.add (local.get $residue_index) (local.get $tmp)))

      ;; block complete
      (if (i32.eq (local.get $residue_index) (i32.const 136))
        (call $keccak_block (local.get $input_offset) (i32.const 136) (local.get $context_offset))

        (local.set $residue_index (i32.const 0))
      )

      (i32.store (local.get $residue_offset) (local.get $residue_index))

      (local.set $input_length (i32.sub (local.get $input_length) (local.get $tmp)))
    )
  )

  ;; while (input_length > block_size)
  (block $done
    (loop $loop
      (if (i32.lt_u (local.get $input_length) (i32.const 136))
        (br $done)
      )

      (call $keccak_block (local.get $input_offset) (i32.const 136) (local.get $context_offset))

      (local.set $input_offset (i32.add (local.get $input_offset) (i32.const 136)))
      (local.set $input_length (i32.sub (local.get $input_length) (i32.const 136)))
      (br $loop)
    )
  )

  ;; copy to the residue buffer
  (if (i32.gt_u (local.get $input_length) (i32.const 0))
    (then
      (drop (call $memcpy
        (i32.add (local.get $residue_buffer) (local.get $residue_index))
        (local.get $input_offset)
        (local.get $input_length)
      ))

      (local.set $residue_index (i32.add (local.get $residue_index) (local.get $input_length)))
      (i32.store (local.get $residue_offset) (local.get $residue_index))
    )
  )
)

;;
;; Finalise and return the hash
;;
;; The 256 bit hash is returned at the output offset.
;;
(func $keccak_finish
  (param $context_offset i32)
  (param $output_offset i32)

  (local $residue_offset i32)
  (local $residue_buffer i32)
  (local $residue_index i32)
  (local $tmp i32)

  ;; this is where we store the pointer
  (local.set $residue_offset (i32.add (local.get $context_offset) (i32.const 200)))
  ;; this is where the buffer is
  (local.set $residue_buffer (i32.add (local.get $context_offset) (i32.const 208)))

  (local.set $residue_index (i32.load (local.get $residue_offset)))
  (local.set $tmp (local.get $residue_index))

  ;; clear the rest of the residue buffer
  (drop (call $memset (i32.add (local.get $residue_buffer) (local.get $tmp)) (i32.const 0) (i32.sub (i32.const 136) (local.get $tmp))))

  ;; ((char*)ctx->message)[ctx->rest] |= 0x01;
  (local.set $tmp (i32.add (local.get $residue_buffer) (local.get $residue_index)))
  (i32.store8 (local.get $tmp) (i32.or (i32.load8_u (local.get $tmp)) (i32.const 0x01)))

  ;; ((char*)ctx->message)[block_size - 1] |= 0x80;
  (local.set $tmp (i32.add (local.get $residue_buffer) (i32.const 135)))
  (i32.store8 (local.get $tmp) (i32.or (i32.load8_u (local.get $tmp)) (i32.const 0x80)))

  (call $keccak_block (local.get $residue_buffer) (i32.const 136) (local.get $context_offset))

  ;; the first 32 bytes pointed at by $output_offset is the final hash
  (i64.store (local.get $output_offset) (i64.load (local.get $context_offset)))
  (i64.store (i32.add (local.get $output_offset) (i32.const 8)) (i64.load (i32.add (local.get $context_offset) (i32.const 8))))
  (i64.store (i32.add (local.get $output_offset) (i32.const 16)) (i64.load (i32.add (local.get $context_offset) (i32.const 16))))
  (i64.store (i32.add (local.get $output_offset) (i32.const 24)) (i64.load (i32.add (local.get $context_offset) (i32.const 24))))
)

;;
;; Calculate the hash. Helper method incorporating the above three.
;;
(func $assembly/wasmx/keccak256
  (param $context_offset i32)
  (param $input_offset i32)
  (param $input_length i32)
  (param $output_offset i32)

  (call $keccak_init (local.get $context_offset))
  (call $keccak_update (local.get $context_offset) (local.get $input_offset) (local.get $input_length))
  (call $keccak_finish (local.get $context_offset) (local.get $output_offset))
)

