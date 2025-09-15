const profiles = document.querySelectorAll(".profile");

    profiles.forEach(profile => {
      profile.addEventListener("click", () => {
        // Remove any old loader
        document.querySelectorAll(".loader").forEach(l => l.remove());
        document.body.classList.add("loading");

        profiles.forEach(p => {
          if (p === profile) {
            p.classList.add("active");
            p.classList.remove("inactive");

            // Wait for animation frame so transform is applied
            requestAnimationFrame(() => {
              const rect = p.getBoundingClientRect();

              const loader = document.createElement("div");
              loader.classList.add("loader");

              // Center loader on profile
              loader.style.top = rect.top + rect.height / 2 + "px";
              loader.style.left = rect.left + rect.width / 2 + "px";
              loader.style.transform = "translate(-50%, -50%)";

              document.body.appendChild(loader);

              setTimeout(() => {
                loader.style.opacity = 1;
              }, 400);
            });

          } else {
            p.classList.add("inactive");
          }
        });
      });
    });