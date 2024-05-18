class SlideShow {
  constructor() {
    this.hideAll()
    const hash = window.location.hash.replace("#", "")
    this.page = hash === "" ? 1 : parseInt(hash)
    window.location.hash = "#" + this.page

    document.addEventListener("keydown", function (event) {
      if (document.activeElement !== document.body) return
      const getLinks = () => document.getElementsByClassName("slideshowNav")[0].getElementsByTagName("a")
      if (event.key === "ArrowLeft") getLinks()[0].click()
      else if (event.key === "ArrowRight") getLinks()[1].click()
    })
    this.renderNav()
    this.listenToHash()
    this.renderSlide()
  }

  renderSlide() {
    jQuery(this.slides[this.page - 1]).show()
    jQuery(".dinkus").hide()
  }

  hideAll() {
    jQuery("div,p,figure").hide()
  }

  get slides() {
    return jQuery(".dinkus")
      .map(function () {
        return $(this).prevUntil(".dinkus").addBack().prev()
      })
      .get()
  }

  listenToHash() {
    window.addEventListener("hashchange", () => {
      this.page = parseInt(window.location.hash.replace("#", ""))
      this.hideAll()
      this.renderSlide()
      this.renderNav()
    })
  }

  renderNav() {
    jQuery(".slideshowNav").html(this.nav).show()
  }

  page = 1

  get pages() {
    return jQuery(".dinkus").length
  }

  get previousPage() {
    let { page } = this
    page--
    if (page === 0) page = this.pages
    return page
  }

  get nextPage() {
    let { page } = this
    page++
    if (page > this.pages) page = 1
    return page
  }

  get nav() {
    return `<a href="#${this.previousPage}">&lt;</a> ${this.page}/${this.pages} <a href="#${this.nextPage}">&gt;</a>`
  }
}

document.addEventListener("DOMContentLoaded", () => new SlideShow())
