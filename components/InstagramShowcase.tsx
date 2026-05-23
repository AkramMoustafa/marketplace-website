"use client";

import { useRef, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { InstagramIcon } from "@/components/icons";

const posts = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&q=80",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&q=80",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&q=80",
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=600&q=80",
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&q=80",
  },
];

export default function InstagramShowcase() {

  const trackRef =
    useRef<HTMLDivElement>(null);

  const [canLeft, setCanLeft] =
    useState(false);

  const [canRight, setCanRight] =
    useState(true);

  const sync = useCallback(() => {

    const el = trackRef.current;

    if (!el) return;

    setCanLeft(
      el.scrollLeft > 4
    );

    setCanRight(
      el.scrollLeft <
      el.scrollWidth -
      el.clientWidth -
      4
    );

  }, []);

  const scroll = (
    dir: "left" | "right"
  ) => {

    const el = trackRef.current;

    if (!el) return;

    const tile =
      el.firstElementChild as HTMLElement;

    const width =
      tile?.offsetWidth || 180;

    el.scrollBy({

      left:
        dir === "right"
          ? width
          : -width,

      behavior:
        "smooth",

    });

  };

  return (

    <section className="
      bg-[#f3f3f3]
      py-3
    ">

      <div className="
        w-full
        px-4
      ">

        {/* HEADER */}

        <div className="
          flex
          items-center
          justify-center
          gap-4

          mb-3

          flex-wrap
        ">

          <div className="
            w-9
            h-9

            rounded-full

            overflow-hidden

            border
            border-pink-500
          ">

            <Image
              src="/logo.png"
              alt=""
              width={36}
              height={36}
              className="
                w-full
                h-full
                object-cover
              "
            />

          </div>

          <div>

            <h2 className="
              text-base

              font-medium

              text-slate-800
            ">

              Empire Auto Sales

            </h2>

            <p className="
              text-xs

              text-slate-500
            ">

              @empireautoinc

            </p>

          </div>

          <div className="
            flex
            gap-4
          ">

            {[
              {
                value: "747",
                label: "Posts",
              },

              {
                value: "7.7K",
                label: "Followers",
              },

              {
                value: "6.4K",
                label: "Following",
              },

            ].map(
              (item) => (

              <div
                key={
                  item.label
                }
              >

                <p className="
                  text-sm
                  font-medium
                ">

                  {
                    item.value
                  }

                </p>

                <span className="
                  text-[10px]

                  text-slate-500
                ">

                  {
                    item.label
                  }

                </span>

              </div>

            ))}

          </div>

          <button className="
            bg-black

            text-white

            px-3
            py-1.5

            rounded-md

            text-xs

            flex
            items-center
            gap-1.5
          ">

            <InstagramIcon
              size={11}
            />

            Follow

          </button>

        </div>

        {/* GALLERY */}

        <div className="
          relative
          w-full
        ">

          {canLeft && (

            <button

              onClick={() =>
                scroll(
                  "left"
                )
              }

              className="
                absolute

                left-2

                top-1/2

                -translate-y-1/2

                z-20

                w-8
                h-8

                rounded-full

                bg-black/70

                text-white
              "
            >

              <ChevronLeft
                size={16}
              />

            </button>

          )}

          {canRight && (

            <button

              onClick={() =>
                scroll(
                  "right"
                )
              }

              className="
                absolute

                right-2

                top-1/2

                -translate-y-1/2

                z-20

                w-8
                h-8

                rounded-full

                bg-black/70

                text-white
              "
            >

              <ChevronRight
                size={16}
              />

            </button>

          )}

          <div

            ref={trackRef}

            onScroll={sync}

            className="
              flex

              overflow-x-auto

              gap-[2px]

              w-full

              scrollbar-hide
            "
          >

            {posts.map(
              (
                post
              ) => (

              <div

                key={
                  post.id
                }

                className="
                      relative

                      shrink-0

                      overflow-hidden

                      basis-[20%]
                    "

                style={{
                  aspectRatio:
                    "1"
                }}
              >

                <Image

                  src={
                    post.url
                  }

                  alt=""

                  fill

                  className="
                    object-cover
                  "
                />

              </div>

            ))}

          </div>

        </div>

      </div>

    </section>

  );

}