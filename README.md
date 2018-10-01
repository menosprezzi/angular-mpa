# Angular for MPA applications

This repo aims to help to integrate Angular with legacy MPA applications, allowing to the frontend developer to make an ease transition to a new SPA code base in the future, reusing the crafted Angular modules created before.

## Integration guide - *How can I use with my old code base?*

Basically, you have to declare the vendors in your main layout.
Here, we will take an legacy ASPNet MVC structure as example (based in [this article](https://dotnetthoughts.net/how-to-use-angular4-wth-aspnet-mvc/))

First, *you need to place this code alongside your code base*. You can create a folder called `Angular`, or `App` or place it in another directory that fits into your project.

Configure the `dist` folder in `gulpfile.js` file to outputs the generated code in your desired folder.
``` javascript
const config = {
  outputPath: '../bundles'
};
```

And configure it in your bundle register.
``` cs
public class BundleConfig
{
    public static void RegisterBundles(BundleCollection bundles)
    {
        // Angular app bundle
        bundles.Add(new ScriptBundle("~/Script/Bundles")
                .Include(
                "~/bundles/runtime.*",
                "~/bundles/polyfills.*",
                "~/bundles/styles.*",
                "~/bundles/vendor.*");
        
        // Home Module bundle
        bundles.Add(new ScriptBundle("~/Script/Home")
                .Include(
                "~/bundles/home.*"); // The main file from Home feature
    }
}
```

Declare the Angular scripts in the main Layout file.
``` cshtml
<!-- ~/Views/Shared/_Layout.cshtml -->
<body>
  @RenderBody()
  @Scripts.Render("~/Script/Bundles")
  @RenderSection("scripts", false)
</body>
```

Finally, in the desired `Index.cshtml` from your View, you have to declare the main component source and define it in your markup,
and it will bootstrap the requested module in the screen.
``` cshtml
@{
    ViewBag.Title = "Index";
}

<app-root></app-root>

@section scripts {
  @Scripts.Render("~/Script/Home")
}
```

## Working on

### How this works
This project is based in some gulp tasks to achieve a design that brings an easy form to integrate with MPA applications.
These tasks runs alongside the Angular CLI ecosystem, that builds and generates all the sources.
Of course, some features like Karma Testing and E2E have to be dropped of to achieve this structure (these features cant run in MPA applications in that way)

## Creating new Modules
The command below will create a new module in `features` folder, with `scss` as the main style processor by default.
``` shell
gulp ng:create --name home
```

## Development mode
The command below will watch a specific module and rebuilds it if necessary.
``` shell
gulp ng:watch --name home
```

## Building
The command below will build the project in prod mode.
``` shell
gulp ng:build --prod
```
